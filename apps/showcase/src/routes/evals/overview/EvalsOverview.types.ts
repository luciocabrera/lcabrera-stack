import type { Regression } from '@repo/eval-history/report/report.types';

import type { SparklinePoint } from '../Sparkline';
import type { RunFigures } from '../types/runFigures.types';

export type JudgedRunPair = MainRunPair & {
  readonly verdict: Regression;
};

export type MainRunPair = {
  readonly latest: RunFigures;
  readonly previous: RunFigures;
  readonly suite: string;
};

export type SuiteSummary = {
  readonly latest: RunFigures;
  readonly points: readonly SparklinePoint[];
  readonly suite: string;
};
