import type {
  DistinctEstimate,
  GroupKeyPeriod,
} from './group-query-builder.types.ts';

import { PERIOD_MEAN_DAYS } from './group-query-builder.constants.ts';

type ResolvePeriodDistinctEstimateArgs = {
  /** What the catalogue says about the **raw** column. */
  readonly estimate: DistinctEstimate;
  readonly period: GroupKeyPeriod;
  /** The column's histogram span, or `null` when there is none to measure. */
  readonly spanDays: number | null;
};

/**
 * How many distinct values `date_trunc(period, column)` can take — the number
 * the cardinality guard has to be asked about, since the catalogue only ever
 * describes the raw column (#786).
 *
 * **Two bounds, and the smaller wins.** Truncation is a function, so it can
 * never produce more distinct values than it consumed — that is the raw
 * estimate. And a truncated value is a period, so there can be no more of them
 * than the column's range contains — that is the span. Neither alone is enough:
 * a column of 1800 daily dates has a raw estimate of 1800 whatever period is
 * asked for, and a one-day span with a million rows has a span bound of 1
 * whatever the raw count is.
 *
 * `+ 1` because a span covers the periods at both ends: a 31-day span crosses
 * at most two months, not one.
 *
 * **A known span upgrades an unknown raw estimate**, rather than being discarded
 * with it. `unknown` is warn-and-proceed (ADR-066), so an unanalysed table
 * offers every granularity; but a column with a histogram and no usable
 * `n_distinct` still has a measurable range, and refusing to use it would leave
 * the guard blind on the one input it does have.
 *
 * `undefinedDistinctness` passes through untouched. It is Postgres saying the
 * type has no equality operator, which is a fact about the column and not about
 * the period — and it is refused a step later on exactly that ground.
 */
export const resolvePeriodDistinctEstimate = ({
  estimate,
  period,
  spanDays,
}: ResolvePeriodDistinctEstimateArgs): DistinctEstimate => {
  if (estimate.kind === 'undefinedDistinctness' || spanDays === null) {
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
