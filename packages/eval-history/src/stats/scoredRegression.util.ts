import type { RegressionConfig, RunIdentity } from './stats.types.ts';
import type { summarize } from './summarize.util.ts';

import { comparability } from './comparability.util.ts';

type ScoredRegressionArgs = {
  readonly allowHarnessChange?: boolean;
  readonly baseline: {
    readonly identity: RunIdentity;
    readonly summary: ReturnType<typeof summarize>;
  };
  readonly config: RegressionConfig;
  readonly pr: {
    readonly identity: RunIdentity;
    readonly scores: readonly number[];
  };
};

export const scoredRegression = ({
  allowHarnessChange,
  baseline,
  config,
  pr,
}: ScoredRegressionArgs) => {
  const comparison = comparability({
    allowHarnessChange,
    main: baseline.identity,
    pr: pr.identity,
  });

  if (comparison.kind === 'incomparable') {
    return comparison;
  }

  if (baseline.summary.kind === 'insufficient' || pr.scores.length === 0) {
    return { kind: 'insufficient' } as const;
  }

  const mean =
    pr.scores.reduce((sum, score) => sum + score, 0) / pr.scores.length;
  const threshold =
    baseline.summary.mean - config.scored.sigma * baseline.summary.stddev;

  if (mean < threshold) {
    return {
      findings: [{ kind: 'mean', mean, threshold }],
      kind: 'regression',
    } as const;
  }

  return { kind: 'clear' } as const;
};
