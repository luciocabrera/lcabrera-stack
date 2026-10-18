import type { RegressionFinding } from '@repo/eval-history/stats/stats.types';

import type { SparklinePoint } from '../Sparkline';
import type { RunFigures } from '../types/runFigures.types';

export type MainRunPair = {
  readonly latest: RunFigures;
  readonly previous: RunFigures;
  readonly suite: string;
};

export type SuiteRegression = MainRunPair & {
  readonly findings: readonly RegressionFinding[];
  readonly flakyLeftOut: readonly string[];
};

export type SuiteSummary = {
  readonly latest: RunFigures;
  readonly points: readonly SparklinePoint[];
  readonly suite: string;
};
