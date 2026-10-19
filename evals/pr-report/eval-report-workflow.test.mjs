import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vite-plus/test';
import { parse } from 'yaml';

import { OPT_IN_LABEL } from './skill-scope.mjs';

const workflow = (name) =>
  parse(
    readFileSync(
      new URL(`../../.github/workflows/${name}`, import.meta.url),
      'utf8',
    ),
  );

const REPORT = workflow('eval-report.yml');
const JOB = REPORT.jobs['eval-report'];
const step = (name) => JOB.steps.find((candidate) => candidate.name === name);

describe('the eval report workflow', () => {
  it('runs on a push to a pull request and when a label is added', () => {
    expect(REPORT.on.pull_request.types).toEqual(
      expect.arrayContaining(['opened', 'synchronize', 'labeled']),
    );
  });

  it('wakes on no label event but the opt-in one', () => {
    expect(JOB.if).toContain(`github.event.label.name == '${OPT_IN_LABEL}'`);
    expect(JOB.concurrency.group).toContain(
      `github.event.label.name != '${OPT_IN_LABEL}'`,
    );
  });

  it('calls a model only when the selection says to run', () => {
    expect(step('Skill triggers on the selected skills').if).toBe(
      "steps.scope.outputs.run == 'true'",
    );
  });

  it('writes and upserts the comment whatever the scope, so a stale report is replaced', () => {
    const write = step('Write the report');
    const post = step('Post or update the PR comment');
    expect(write.if).not.toContain('outputs.scope');
    expect(post.if).not.toContain('outputs.scope');
    expect(post.run).toContain('--only-existing');
  });

  it('leaves the agent-evals workflow, whose label events would rerun its model jobs', () => {
    const agentEvals = workflow('agent-evals.yml');
    expect(Object.keys(agentEvals.jobs)).not.toContain('eval-report');
    expect(agentEvals.on.pull_request?.types).toBeUndefined();
  });
});
