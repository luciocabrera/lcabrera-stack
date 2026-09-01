import type {
  DistinctEstimate,
  GroupKeyPeriod,
} from './group-query-builder.types.ts';

import { PERIOD_MEAN_DAYS } from './group-query-builder.constants.ts';

type ResolvePeriodDistinctEstimateArgs = {
  readonly estimate: DistinctEstimate;
  readonly period: GroupKeyPeriod;
  readonly spanDays: number | undefined;
};

export const resolvePeriodDistinctEstimate = ({
  estimate,
  period,
  spanDays,
}: ResolvePeriodDistinctEstimateArgs): DistinctEstimate => {
  if (spanDays === undefined || estimate.kind === 'undefinedDistinctness') {
    return estimate;
  }

  const spanned =
    Math.floor(Math.max(spanDays, 0) / PERIOD_MEAN_DAYS[period]) + 1;

  return {
    kind: 'known',
    value:
      estimate.kind === 'known' ? Math.min(estimate.value, spanned) : spanned,
  };
};
