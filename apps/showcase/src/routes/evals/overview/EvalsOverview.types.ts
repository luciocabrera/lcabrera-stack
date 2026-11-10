import type { TrendPoint } from '@lcabrera/ui/components/TrendSparkline';
import type { Regression } from '@repo/eval-history/report/report.types';

import type { RunFigures } from '../types/runFigures.types';
import type { suiteRegressions } from './suiteRegressions.util';

export type JudgedRunPair = MainRunPair & {
  readonly verdict: Regression;
};

export type MainRunPair = {
  readonly latest: RunFigures;
  readonly previous: RunFigures;
  readonly suite: string;
};

export type RegressionAlertProps = {
  readonly regression: ReturnType<typeof suiteRegressions>[number];
};

export type SuiteCardProps = {
  readonly summary: SuiteSummary;
};

export type SuiteSummary = {
  readonly flakyLeftOut?: readonly string[];
  readonly latest: RunFigures;
  readonly points: readonly TrendPoint[];
  readonly suite: string;
};
