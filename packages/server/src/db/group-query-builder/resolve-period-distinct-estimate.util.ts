import type {
  DistinctEstimate,
  GroupKeyPeriod,
} from './group-query-builder.types.ts';

import { PERIOD_MEAN_DAYS } from './group-query-builder.constants.ts';

type ResolvePeriodDistinctEstimateArgs = {
  /** What the catalogue says about the **raw** column. */
  readonly estimate: DistinctEstimate;
  readonly period: GroupKeyPeriod;
  readonly spanDays: number | undefined;
};

/**
 * How many distinct values `date_trunc(period, column)` can take — the number the
 * cardinality guard has to be asked about, since the catalogue only ever describes the raw
 * column (#786).
 * **Two bounds, and the smaller wins.** Truncation is a function, so it can never produce
 * more distinct values than it consumed — that is the raw estimate.
 */
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
