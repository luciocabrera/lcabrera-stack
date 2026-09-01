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
