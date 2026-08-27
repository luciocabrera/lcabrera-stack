import { describe, expect, it } from 'vite-plus/test';

import {
  commandsIn,
  commandsRunByCi,
  runStepBodies,
  workflowTriggers,
} from './ci-commands.mjs';

// What this defends: the `met` rule's decidable half. A requirement declaring
// `met` points at a command CI runs, so "CI runs it" has to mean a step
// executing it — not a workflow COMMENT naming it, and not a scheduled
// workflow that never sees the commit making the claim. Both are planted
// below, because either one passing would make the rule look enforced while
// accepting a pointer nothing runs.

const GATE_WORKFLOW = `name: Check Safe

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  quality-gate:
    steps:
      - name: Docs
        # Repair: vp run docs:mentioned-only --write
        run: vp run docs:verify
      - name: Tests
        run: |
          vp run typegen:all
          vp run test:ci
`;

const SCHEDULED_WORKFLOW = `name: Deps Audit

on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:

jobs:
  audit:
    steps:
      - run: vp run deps:audit
`;

describe('workflowTriggers', () => {
  it('reads the block form without its nested keys', () => {
    expect([...workflowTriggers(GATE_WORKFLOW)]).toEqual([
      'pull_request',
      'push',
    ]);
  });

  it('reads the inline form and the quoted key YAML forces', () => {
    expect([...workflowTriggers("'on': [push, pull_request]\n")]).toEqual([
      'push',
      'pull_request',
    ]);
  });

  it('reads a scheduled workflow as scheduled', () => {
    expect([...workflowTriggers(SCHEDULED_WORKFLOW)]).toEqual([
      'schedule',
      'workflow_dispatch',
    ]);
  });
});

describe('runStepBodies', () => {
  it('collects a single-line step and a block step', () => {
    expect(runStepBodies(GATE_WORKFLOW)).toEqual([
      'vp run docs:verify',
      'vp run typegen:all\nvp run test:ci\n',
    ]);
  });

  it('leaves a command that only appears in a comment out', () => {
    expect(runStepBodies(GATE_WORKFLOW).join('\n')).not.toContain(
      'docs:mentioned-only',
    );
  });
});

describe('commandsRunByCi', () => {
  const workflows = [{ source: GATE_WORKFLOW }, { source: SCHEDULED_WORKFLOW }];
  const rootScripts = {
    'deps:audit': 'vp pm audit --json | node scripts/verify-deps-audit.mjs',
    'docs:verify': 'repo-verify-docs-paths',
    'test:ci': "vp run --filter '!showcase' test && vp run test:scripts",
    'test:scripts': 'vitest run --root scripts',
  };

  it('counts a command a change-triggered workflow runs', () => {
    expect(commandsRunByCi({ rootScripts, workflows }).has('docs:verify')).toBe(
      true,
    );
  });

  it('counts a command chained from one, transitively', () => {
    expect(
      commandsRunByCi({ rootScripts, workflows }).has('test:scripts'),
    ).toBe(true);
  });

  it('does not count one only a scheduled workflow runs', () => {
    expect(commandsRunByCi({ rootScripts, workflows }).has('deps:audit')).toBe(
      false,
    );
    // The same command, in the same list, once a change triggers its workflow —
    // so the exclusion above is answering the trigger and nothing else.
    expect(
      commandsRunByCi({
        rootScripts,
        workflows: [
          { source: SCHEDULED_WORKFLOW.replace('schedule:', 'push:') },
        ],
      }).has('deps:audit'),
    ).toBe(true);
  });

  // The over-reporting limit, pinned so the header and the code cannot drift
  // apart again: a filter is read by neither, so the task counts either way.
  // Both of these workflows would sit out most pull requests.
  it('counts a task from a branch-filtered or path-filtered workflow', () => {
    const branchFiltered =
      'name: Release\n\non:\n  push:\n    branches: [main]\n\njobs:\n  publish:\n    steps:\n      - run: vp run publish:verify\n';
    const pathFiltered =
      'name: Lighthouse\n\non:\n  pull_request:\n    paths:\n      - apps/showcase/**\n\njobs:\n  audit:\n    steps:\n      - run: vp run audit:lighthouse\n';

    const counted = commandsRunByCi({
      rootScripts,
      workflows: [{ source: branchFiltered }, { source: pathFiltered }],
    });

    expect(counted.has('publish:verify')).toBe(true);
    expect(counted.has('audit:lighthouse')).toBe(true);
  });

  it('does not count one named only in a comment', () => {
    expect(
      commandsRunByCi({ rootScripts, workflows }).has('docs:mentioned-only'),
    ).toBe(false);
  });
});

describe('commandsIn', () => {
  it('reads every task named after `vp run`', () => {
    expect(commandsIn('vp run a:b && vp run c')).toEqual(['a:b', 'c']);
  });

  // The under-reporting limit: a task behind `--filter` is not named here, so a
  // pointer at one fails to resolve rather than being flattered. (The other
  // limit runs the other way — see the module header.)
  it('names no task behind a flag', () => {
    expect(commandsIn('vp run --filter showcase test')).toEqual([]);
  });
});
