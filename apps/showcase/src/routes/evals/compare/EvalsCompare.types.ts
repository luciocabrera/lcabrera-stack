import type { RunSummary } from '@repo/eval-history/queries/queries.types';
import type { readRunComparison } from '@repo/eval-history/queries/readRunComparison.service';

import type { loader } from './evals-compare.loader';

export type ComparePickerProps = {
  readonly choices: Awaited<ReturnType<typeof loader>>['choices'];
};

export type CompareReportProps = {
  readonly comparison: Comparison;
};

export type CompareTotal = Comparison['totals'][number];

export type FlippedTask = Comparison['flips'][number];

export type RunComparisonRow = Awaited<
  ReturnType<typeof readRunComparison>
>[number];

export type RunInputs = Pick<
  RunSummary,
  'catalogHash' | 'harnessVersion' | 'modelId' | 'sdkVersion'
>;

type Comparison = NonNullable<Awaited<ReturnType<typeof loader>>['comparison']>;
