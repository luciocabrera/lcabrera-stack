/**
 * Fixed inputs the envelope tests share: a run identity that passes the
 * schema, and the metrics a finished Agent SDK session yields, so each suite's
 * test builds a whole envelope and parses it instead of checking fields alone.
 * Usage: imported by the `*.test.mjs` files under `evals/`.
 */
import { sessionMetrics } from './agent-sessions.mjs';

export const TEST_REGRESSION_CONFIG = { minTrialsForRate: 6, z: 1.96 };

export const STARTED_AT = Date.UTC(2026, 9, 6, 9, 0, 0);

export const testIdentity = {
  actor: 'tester',
  branch: 'feat/1-envelope',
  env: { arch: 'x64', ci_runner: null, node: 'v26.10.0', os: 'linux' },
  git_dirty: false,
  git_sha: '0123456789abcdef0123456789abcdef01234567',
  pr_number: null,
  run_id: '1f07f209-956c-48a0-8945-a2e39ee047a8',
  started_at: new Date(STARTED_AT).toISOString(),
  trigger: 'local',
};

export const finishedSession = ({ cost = 0.12, subtype = 'success' } = {}) =>
  sessionMetrics(
    [
      {
        duration_api_ms: 900,
        duration_ms: 1200,
        is_error: subtype !== 'success',
        modelUsage: {
          'claude-opus-5-5': {
            cacheCreationInputTokens: 4,
            cacheReadInputTokens: 3,
            costUSD: cost,
            inputTokens: 100,
            outputTokens: 20,
          },
        },
        num_turns: 2,
        subtype,
        total_cost_usd: cost,
        type: 'result',
      },
    ],
    {
      finished: STARTED_AT + 1300,
      firstToken: STARTED_AT + 400,
      queued: STARTED_AT,
      started: STARTED_AT + 50,
    },
  );

export const testPlan = (overrides) => ({
  harnessVersion: 'a8368fc2f15d',
  modelId: 'claude-opus-5-5',
  sdkVersion: '0.3.289',
  settings: {
    argv: [],
    concurrency: 1,
    hidden: [],
    max_turns: null,
    runs: 1,
    selection: [],
    timeout_ms: null,
    tools: [],
  },
  subjects: [],
  tasks: [],
  ...overrides,
});
