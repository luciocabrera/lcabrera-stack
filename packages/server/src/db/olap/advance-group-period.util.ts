import type { GroupKeyPeriod } from '../group-query-builder/group-query-builder.types.ts';

type AdvanceGroupPeriodArgs = {
  /**
   * Whether the value came from a `timestamptz` column, which the builder
   * truncates in UTC — and therefore whether the calendar arithmetic below runs
   * in UTC or in the local frame `pg` materialised the value in.
   */
  readonly isZoned: boolean;
  readonly period: GroupKeyPeriod;
  /** The group's own key value: the period's first instant. */
  readonly start: Date;
};

/** How many months each period advances by. A day is handled on its own. */
const MONTHS_BY_PERIOD: Readonly<Record<GroupKeyPeriod, number>> = {
  day: 0,
  month: 1,
  quarter: 3,
  year: 12,
};

/**
 * The first instant of the period *after* the one this value starts — the upper
 * bound of a drilled group's half-open range (#786).
 *
 * **Calendar arithmetic, never a fixed number of milliseconds.** Months are 28
 * to 31 days and a year is sometimes 366, so adding a constant would put the
 * last day of most months in the next group and lose it from this one. Adding
 * to the month field lets the platform normalise December + 1 into January of
 * the next year, and a day is the one period where adding to the date field is
 * the whole of it.
 *
 * **Which frame the arithmetic runs in is not a detail, and the two are not
 * interchangeable.** `date_trunc(field, col::timestamp)` yields a zone-free
 * timestamp, which `pg` materialises as a `Date` holding those wall-clock
 * fields in the **local** zone — so `2021-01-01 00:00` arrives as a `Date` whose
 * `toISOString()` is the previous day under any positive offset. Reading it back
 * with UTC accessors would therefore advance from the wrong month at the start
 * of every month, for half the world. A `timestamptz` truncated in UTC arrives
 * as the true instant and must be read the other way round. Both were measured
 * against a live Postgres before this was written.
 */
export const advanceGroupPeriod = ({
  isZoned,
  period,
  start,
}: AdvanceGroupPeriodArgs): Date => {
  const next = new Date(start.getTime());

  if (period === 'day') {
    if (isZoned) next.setUTCDate(next.getUTCDate() + 1);
    else next.setDate(next.getDate() + 1);

    return next;
  }

  const months = MONTHS_BY_PERIOD[period];

  if (isZoned) next.setUTCMonth(next.getUTCMonth() + months);
  else next.setMonth(next.getMonth() + months);

  return next;
};
