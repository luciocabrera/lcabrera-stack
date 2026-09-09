/**
 * Stryker configuration for `@lcabrera/utils` — run it with
 * `vp run mutation:report` from the repository root.
 *
 * Mutation testing answers the question coverage cannot: not whether a line
 * ran, but whether a test would notice it being wrong. Why this package and
 * why a report rather than a gate is
 * [ADR-119](../../docs/decisions/ADR-119-mutation-testing-measures-whether-a-test-would-catch-the-bug.md).
 *
 * Two of these values are load-bearing, and changing either invalidates the
 * baseline that a future gate would diff against:
 *
 * - `concurrency` and `timeoutMS`. Left at Stryker's defaults the pool is sized
 *   to the machine, and with the command runner every slot is a full Node +
 *   Vite process. A saturated box returns real verdicts as `Timeout` — which
 *   scores as *detected*, so the score drifts in the safe direction and no
 *   failure is reported. Pinned, two consecutive runs give identical survivor
 *   lists. Raising `concurrency` on a bigger machine is not free tuning: re-take
 *   the baseline, and check the timeout count is still zero.
 *
 * - `testRunner: 'command'` rather than `vitest-runner`, because `vite` here
 *   resolves to `@voidzero-dev/vite-plus-core` and `vitest` is 4.x. It runs the
 *   `test` task itself, not a copy of the string that task expands to, so the
 *   two cannot drift. `coverageAnalysis` must be `off`: the command runner sees
 *   only an exit code, so per-test coverage is not available to filter on.
 *
 * The reporter path climbs to the repository root because Stryker runs with this
 * package as its working directory, and `reports/` is a repo-wide convention
 * (ADR-049 — produced on demand, never committed).
 */
export default {
  commandRunner: { command: 'vp run test' },
  concurrency: 4,
  coverageAnalysis: 'off',
  jsonReporter: { fileName: '../../reports/mutation/full-latest.json' },
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.types.ts',
    '!src/**/*.constants.ts',
  ],
  reporters: ['clear-text', 'progress', 'json'],
  testRunner: 'command',
  thresholds: { break: null },
  timeoutMS: 30_000,
};
