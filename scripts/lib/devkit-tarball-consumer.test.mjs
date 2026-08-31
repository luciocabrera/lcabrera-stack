/*
 * What a consumer is left holding after `devkit init` runs from a tarball: the
 * tasks it wired, and whether the hooks it placed will be run at all.
 *
 * A sibling of `devkit-tarball.test.mjs` because that file reached the
 * script-size ceiling, and these two are the cohesive half — everything here is
 * about the consumer's tree rather than about the packed artifact.
 */

import { describe, expect, it } from 'vite-plus/test';

import {
  bareTaskFindings,
  clobberedConfigKeys,
  inertHooks,
  taskFindings,
} from './devkit-tarball.mjs';

describe('clobberedConfigKeys', () => {
  const before = {
    commands: { install: 'npm ci' },
    gates: { strayConfigs: {} },
    profile: 'full',
    publishing: { publicPackageDirs: ['ui'] },
  };

  it('accepts a re-init that kept every block it does not own', () => {
    expect(
      clobberedConfigKeys({
        after: { ...before, commands: { install: 'pnpm i' } },
        before,
      }),
    ).toEqual([]);
  });

  it('reports a block the command deleted', () => {
    expect(
      clobberedConfigKeys({
        after: { commands: {}, profile: 'full', publishing: before.publishing },
        before,
      }),
    ).toEqual([
      '`devkit init --force` deleted `gates` from devkit.config.json — that file is shared with the gate runtime, which reads it',
    ]);
  });

  it('treats a config with nothing to preserve as a finding', () => {
    expect(
      clobberedConfigKeys({
        after: { commands: {}, profile: 'agent' },
        before: { commands: {}, profile: 'agent' },
      }),
    ).toEqual([
      'the scratch config carried no block for `devkit init --force` to preserve, so nothing about it was checked',
    ]);
  });
});

describe('bareTaskFindings', () => {
  const expected = ['adr:verify', 'devkit:check'];
  const scripts = { 'adr:verify': 'repo-verify-adrs', 'devkit:check': 'x' };

  it('accepts tasks that are present and ran clean', () => {
    expect(bareTaskFindings({ expected, failures: [], scripts })).toEqual([]);
  });

  it('reports a task that runs but fails on a fresh repository', () => {
    expect(
      bareTaskFindings({
        expected,
        failures: [
          { detail: 'names no unread config files', name: 'x:verify' },
        ],
        scripts,
      }),
    ).toEqual([
      'task `x:verify` is wired but does not run on a freshly initialised repository: names no unread config files',
    ]);
  });

  it('reports a task that quietly stopped being written', () => {
    expect(
      bareTaskFindings({
        expected,
        failures: [],
        scripts: { 'devkit:check': 'x' },
      }),
    ).toEqual([
      '`devkit init` wrote no `adr:verify` task, so this gate no longer runs it',
    ]);
  });
});

describe('taskFindings', () => {
  const availableBins = ['devkit', 'repo-verify-commit'];

  it('accepts tasks whose binaries are installed', () => {
    expect(
      taskFindings({
        availableBins,
        scripts: {
          'commit:verify': 'repo-verify-commit',
          'devkit:check': 'devkit doctor --check',
        },
      }),
    ).toEqual([]);
  });

  it('reports a task naming a binary nobody installed', () => {
    expect(
      taskFindings({
        availableBins,
        scripts: {
          'adr:verify': 'repo-verify-adrs',
          'devkit:sync': 'devkit sync',
        },
      }),
    ).toEqual([
      'task `adr:verify` runs `repo-verify-adrs`, and no such binary was installed',
    ]);
  });

  it('treats a manifest with no runnable task as a finding', () => {
    const noneWired =
      '`devkit init` left no runnable gate task in the consumer manifest, so nothing it set up can be invoked';
    expect(taskFindings({ availableBins, scripts: { build: 'tsc' } })).toEqual([
      noneWired,
    ]);
    expect(taskFindings({ availableBins })).toEqual([noneWired]);
  });
});

describe('inertHooks', () => {
  const hooksPath = '.githooks';

  it('accepts hooks that arrived executable', () => {
    expect(
      inertHooks({
        hooksPath,
        materialised: [
          { executable: true, path: '.githooks/commit-msg' },
          { executable: false, path: 'docs/agents/workflow.md' },
        ],
      }),
    ).toEqual([]);
  });

  it('reports a hook without the bit, which git skips without a word', () => {
    expect(
      inertHooks({
        hooksPath,
        materialised: [{ executable: false, path: '.githooks/commit-msg' }],
      }),
    ).toEqual([
      '`.githooks/commit-msg` arrived without the executable bit — git skips it silently, so the gate it carries is absent',
    ]);
  });

  it('treats finding no hooks at all as a finding, not a pass', () => {
    expect(
      inertHooks({
        hooksPath,
        materialised: [{ executable: false, path: 'docs/agents/workflow.md' }],
      }),
    ).toEqual([
      'no hooks were materialised under `.githooks/`, so their executability was never checked',
    ]);
  });

  it('matches on the directory, not on a name that merely starts the same', () => {
    expect(
      inertHooks({
        hooksPath,
        materialised: [
          { executable: true, path: '.githooks/pre-push' },
          { executable: false, path: '.githooks-backup/pre-push' },
        ],
      }),
    ).toEqual([]);
  });
});
