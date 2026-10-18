import type { RegressionConfig } from '../stats/stats.types.ts';

export const regressionConfigFixture = (
  overrides: Partial<RegressionConfig> = {},
): RegressionConfig => ({
  baseline: { defaultRuns: 5 },
  binary: { flip: { failAtLeast: 2, ofTrials: 3 } },
  flaky: { disagreeFraction: 0.2, window: 10 },
  minTrialsForRate: 6,
  scored: { sigma: 2 },
  z: 1.96,
  ...overrides,
});
