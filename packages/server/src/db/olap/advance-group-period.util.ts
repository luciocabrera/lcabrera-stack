import type { GroupKeyPeriod } from '../group-query-builder/group-query-builder.types.ts';

type AdvanceGroupPeriodArgs = {
  readonly isZoned: boolean;
  readonly period: GroupKeyPeriod;
  readonly start: Date;
};

const MONTHS_BY_PERIOD: Readonly<Record<GroupKeyPeriod, number>> = {
  day: 0,
  month: 1,
  quarter: 3,
  year: 12,
};

/**
 * **Calendar arithmetic, never a fixed number of milliseconds.** Months are 28 to 31 days
 * and a year is sometimes 366, so adding a constant would put the last day of most months
 * in the next group and lose it from this one.
 * **Which frame the arithmetic runs in is not a detail, and the two are not
 * interchangeable.** `date_trunc(field, col::timestamp)` yields a zone-free timestamp,
 * which `pg` materialises as a `Date` holding those wall-clock fields in the **local**
 * zone — so `2021-01-01 00:00` arrives as a `Date` whose `toISOString()` is the previous
 * day under any positive offset.
 */
export const advanceGroupPeriod = ({
  isZoned,
  period,
  start,
}: AdvanceGroupPeriodArgs): Date => {
  const next = new Date(start);

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
