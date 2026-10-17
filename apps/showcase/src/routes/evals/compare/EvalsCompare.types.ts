import type { RunSummary } from '@repo/eval-history/queries/queries.types';
import type { readRunComparison } from '@repo/eval-history/queries/readRunComparison.service';

import type { loader } from './evals-compare.loader';

export type ComparePickerProps = {
  readonly choices: Awaited<ReturnType<typeof loader>>['choices'];
};

export type CompareReportProps = {
  readonly comparison: NonNullable<
    Awaited<ReturnType<typeof loader>>['comparison']
  >;
};

export type RunComparisonRow = Awaited<
  ReturnType<typeof readRunComparison>
>[number];

export type RunInputs = Pick<
  RunSummary,
  'catalogHash' | 'harnessVersion' | 'modelId' | 'sdkVersion'
>;
