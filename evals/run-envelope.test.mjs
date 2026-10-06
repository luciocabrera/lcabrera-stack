import { parseEnvelope } from '@repo/eval-history/envelope/parseEnvelope.util';
import { describe, expect, it } from 'vite-plus/test';

import {
  finishedSession,
  STARTED_AT,
  TEST_REGRESSION_CONFIG,
  testIdentity,
  testPlan,
} from './envelope-test-support.mjs';
import {
  actorOf,
  assembleEnvelope,
  branchOf,
  envelopeProblems,
  passRateLine,
  passRateOf,
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
      runTotals({
        costFree: false,
        durationMs: 10,
        regressionConfig: TEST_REGRESSION_CONFIG,
        trials,
      }),
    ).toStrictEqual({
      by_outcome: { error: 1, fail: 1, pass: 1, skipped: 0, timeout: 0 },
      cost_usd_reported: 0.75,
      duration_ms: 10,
      pass_rate: { k: 1, lower: null, n: 2, rate: null, upper: null },
      tokens: { cache_read: 0, cache_write: 0, input: 5, output: 0 },
      trials: 3,
    });
  });

  it('costs nothing for a suite that calls no model, and null when none reported', () => {
    expect(
      runTotals({
        costFree: true,
        durationMs: 0,
        regressionConfig: TEST_REGRESSION_CONFIG,
        trials: [],
      }).cost_usd_reported,
    ).toBe(0);
    expect(
      runTotals({
        costFree: false,
        durationMs: 0,
        regressionConfig: TEST_REGRESSION_CONFIG,
        trials: [trials[1]],
      }).cost_usd_reported,
    ).toBeNull();
  });
});

const outcomes = (counts) =>
  Object.entries(counts).flatMap(([outcome, count]) =>
    Array.from({ length: count }, () => ({ outcome })),
  );

describe('passRateOf', () => {
  it('carries n, the rate and its Wilson interval from the minimum trials on', () => {
    expect(
      passRateOf({
        regressionConfig: TEST_REGRESSION_CONFIG,
        trials: outcomes({ fail: 5, pass: 5 }),
      }),
    ).toStrictEqual({
      k: 5,
      lower: expect.closeTo(0.2366, 4),
      n: 10,
      rate: 0.5,
      upper: expect.closeTo(0.7634, 4),
    });
  });

  it('gives no rate and no interval below the minimum trials', () => {
    expect(
      passRateOf({
        regressionConfig: TEST_REGRESSION_CONFIG,
        trials: outcomes({ fail: 1, pass: 4 }),
      }),
    ).toStrictEqual({ k: 4, lower: null, n: 5, rate: null, upper: null });
  });

  it('counts neither error, timeout nor skipped toward n', () => {
    expect(
      passRateOf({
        regressionConfig: TEST_REGRESSION_CONFIG,
        trials: outcomes({ error: 2, pass: 5, skipped: 1, timeout: 1 }),
      }),
    ).toStrictEqual({ k: 5, lower: null, n: 5, rate: null, upper: null });
  });

  it('reads the minimum and z from the config it is given', () => {
    const trials = outcomes({ fail: 1, pass: 3 });
    expect(
      passRateOf({ regressionConfig: { minTrialsForRate: 4, z: 1.96 }, trials })
        .rate,
    ).toBe(0.75);
    const narrow = passRateOf({
      regressionConfig: { minTrialsForRate: 4, z: 1 },
      trials,
    });
    const wide = passRateOf({
      regressionConfig: { minTrialsForRate: 4, z: 1.96 },
      trials,
    });
    expect(narrow.lower).toBeGreaterThan(wide.lower);
  });
});

const totalsOf = (counts) =>
  runTotals({
    costFree: true,
    durationMs: 0,
    regressionConfig: TEST_REGRESSION_CONFIG,
    trials: outcomes(counts).map((trial) => ({ ...trial, tokens: tokensOf() })),
  });

describe('passRateLine', () => {
  it('prints the rate with n and its interval', () => {
    expect(
      passRateLine({
        regressionConfig: TEST_REGRESSION_CONFIG,
        totals: totalsOf({ fail: 5, pass: 5 }),
      }),
    ).toBe(
      'Pass rate: 50.0% (n=10, 5 passed; Wilson interval 23.7%–76.3% at z=1.96)',
    );
  });

  it('prints insufficient data under the minimum trials', () => {
    expect(
      passRateLine({
        regressionConfig: TEST_REGRESSION_CONFIG,
        totals: totalsOf({ fail: 1, pass: 4 }),
      }),
    ).toBe(
      'Pass rate: insufficient data (n=5, 4 passed; a rate needs 6 counted trials)',
    );
  });

  it('says how many trials it left out of n', () => {
    expect(
      passRateLine({
        regressionConfig: TEST_REGRESSION_CONFIG,
        totals: totalsOf({ error: 2, fail: 1, pass: 5 }),
      }),
    ).toBe(
      'Pass rate: 83.3% (n=6, 5 passed; Wilson interval 43.6%–97.0% at z=1.96; 2 error, timeout or skipped not counted)',
    );
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
      regressionConfig: TEST_REGRESSION_CONFIG,
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
