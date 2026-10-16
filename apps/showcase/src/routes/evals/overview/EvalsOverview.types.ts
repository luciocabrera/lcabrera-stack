import type { SparklinePoint } from '../Sparkline';
import type { RunFigures } from '../types/runFigures.types';

export type SuiteRegression = {
  readonly latest: RunFigures;
  readonly previous: RunFigures;
  readonly suite: string;
};

export type SuiteSummary = {
  readonly latest: RunFigures;
  readonly points: readonly SparklinePoint[];
  readonly suite: string;
};
