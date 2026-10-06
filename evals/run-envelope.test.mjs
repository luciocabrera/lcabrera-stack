import { parseEnvelope } from '@repo/eval-history/envelope/parseEnvelope.util';
import { describe, expect, it } from 'vite-plus/test';

import {
  finishedSession,
  STARTED_AT,
  testIdentity,
  testPlan,
} from './envelope-test-support.mjs';
import {
  actorOf,
  assembleEnvelope,
  branchOf,
  envelopeProblems,
  prNumberOf,
  relativeImports,
  runSettings,
  runTotals,
  sessionTrial,
  tokensOf,
  triggerOf,
} from './run-envelope.mjs';

const RULES_DETAIL = { check: 'indexed', findings: [], schema: 'rules/1' };

describe('triggerOf', () => {
  it('is local outside GitHub Actions and names the event inside it', () => {
    expect(triggerOf({})).toBe('local');
    expect(
      triggerOf({ GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'pull_request' }),
    ).toBe('ci-pr');
    expect(
      triggerOf({ GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'schedule' }),
    ).toBe('ci-scheduled');
    expect(
      triggerOf({ GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'merge_group' }),
    ).toBe('ci-push');
    expect(triggerOf({ GITHUB_ACTIONS: 'true' })).toBe('ci-manual');
  });
});

describe('run identity readers', () => {
  it('reads the pull request number only from a pull ref', () => {
    expect(prNumberOf({ GITHUB_REF: 'refs/pull/1342/merge' })).toBe(1342);
    expect(prNumberOf({ GITHUB_REF: 'refs/heads/main' })).toBeNull();
    expect(prNumberOf({})).toBeNull();
  });

  it('prefers the CI branch and actor over the local ones', () => {
    expect(branchOf({ env: {}, head: 'feat/x' })).toBe('feat/x');
    expect(
      branchOf({ env: { GITHUB_HEAD_REF: 'feat/pr' }, head: 'HEAD' }),
    ).toBe('feat/pr');
    expect(actorOf({ email: 'dev@example.com', env: {}, user: 'u' })).toBe(
      'dev',
    );
    expect(actorOf({ email: undefined, env: {}, user: 'u' })).toBe('u');
    expect(
      actorOf({
        email: 'dev@example.com',
        env: { GITHUB_ACTOR: 'bot' },
        user: 'u',
      }),
    ).toBe('bot');
  });
});

describe('sessionTrial', () => {
  const trial = (overrides) =>
    sessionTrial({
      detail: RULES_DETAIL,
      metrics: finishedSession(),
      passed: true,
      queuedAt: STARTED_AT,
      taskKey: 'skills/react-19/trigger',
      trialIndex: 0,
      ...overrides,
    });

  it('carries the session cost, tokens, turns, durations and times', () => {
    expect(trial({})).toMatchObject({
      cost_usd_reported: 0.12,
      duration_api_ms: 900,
      duration_ms: 1200,
      error_class: null,
      finished_at: '2026-10-06T09:00:01.300Z',
      outcome: 'pass',
      queued_at: '2026-10-06T09:00:00.000Z',
      started_at: '2026-10-06T09:00:00.050Z',
      tokens: { cache_read: 3, cache_write: 4, input: 100, output: 20 },
      turns: 2,
    });
  });

  it('records an error with the session class, else the fallback, never as fail', () => {
    expect(
      trial({
        error: 'ended with error_max_turns',
        metrics: finishedSession({ subtype: 'error_max_turns' }),
      }),
    ).toMatchObject({ error_class: 'max_turns', outcome: 'error' });
    expect(trial({ error: 'held Bash' })).toMatchObject({
      error_class: 'harness',
      outcome: 'error',
    });
    expect(trial({ passed: false })).toMatchObject({
      error_class: null,
      outcome: 'fail',
    });
  });

  it('stamps the queue time and zero tokens when no session ran', () => {
    expect(trial({ error: 'setup failed', metrics: undefined })).toMatchObject({
      cost_usd_reported: null,
      queued_at: '2026-10-06T09:00:00.000Z',
      started_at: null,
      tokens: tokensOf(),
    });
  });
});

describe('runTotals', () => {
  const trials = [
    { cost_usd_reported: 0.5, outcome: 'pass', tokens: tokensOf({ input: 2 }) },
    {
      cost_usd_reported: null,
      outcome: 'fail',
      tokens: tokensOf({ input: 3 }),
    },
    { cost_usd_reported: 0.25, outcome: 'error', tokens: tokensOf() },
  ];

  it('counts outcomes, leaves errors out of the rate, and sums what was reported', () => {
    expect(
      runTotals({ costFree: false, durationMs: 10, trials }),
    ).toStrictEqual({
      by_outcome: { error: 1, fail: 1, pass: 1, skipped: 0, timeout: 0 },
      cost_usd_reported: 0.75,
      duration_ms: 10,
      pass_rate: { k: 1, lower: null, n: 2, rate: 0.5, upper: null },
      tokens: { cache_read: 0, cache_write: 0, input: 5, output: 0 },
      trials: 3,
    });
  });

  it('costs nothing for a suite that calls no model, and null when none reported', () => {
    expect(
      runTotals({ costFree: true, durationMs: 0, trials: [] })
        .cost_usd_reported,
    ).toBe(0);
    expect(
      runTotals({ costFree: false, durationMs: 0, trials: [trials[1]] })
        .cost_usd_reported,
    ).toBeNull();
  });
});

describe('assembleEnvelope', () => {
  it('builds an envelope the schema accepts', () => {
    const envelope = assembleEnvelope({
      finishedAt: STARTED_AT + 5000,
      identity: testIdentity,
      plan: testPlan({
        settings: runSettings({ argv: ['x'], concurrency: 4, runs: 3 }),
        suite: 'rules-consistency',
      }),
      status: 'partial',
      trials: [],
    });
    expect(parseEnvelope(envelope).ok).toBe(true);
    expect(envelope).toMatchObject({
      run: {
        finished_at: '2026-10-06T09:00:05.000Z',
        sdk_version: '0.3.289',
        status: 'partial',
        totals: { duration_ms: 5000, trials: 0 },
      },
      schema_version: 1,
    });
  });
});

describe('envelopeProblems', () => {
  it('names the field each issue is about', () => {
    expect(
      envelopeProblems([
        { message: 'Invalid string', path: ['run', 'git_sha'] },
        { message: 'Required', path: [] },
      ]),
    ).toStrictEqual(['run.git_sha: Invalid string', '(root): Required']);
  });
});

describe('relativeImports', () => {
  it('lists the relative specifiers and skips packages', () => {
    expect(
      relativeImports(
        [
          "import { a } from './a.mjs';",
          "import { b } from '../b.mjs';",
          "import { c } from 'node:path';",
          "import './side.mjs';",
        ].join('\n'),
      ),
    ).toStrictEqual(['./a.mjs', '../b.mjs', './side.mjs']);
  });
});
