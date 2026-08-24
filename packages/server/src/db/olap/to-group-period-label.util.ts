import type { GroupKeyPeriod } from '../group-query-builder/group-query-builder.types.ts';
import type { GroupKeyTruncation } from './olap.types.ts';

type PadArgs = {
  readonly length: number;
  readonly value: number;
};

type ToGroupPeriodLabelArgs = GroupKeyTruncation & {
  readonly value: unknown;
};

const pad = ({ length, value }: PadArgs) => String(value).padStart(length, '0');

type PeriodFieldsArgs = {
  readonly day: number;
  readonly month: number;
  readonly year: number;
};

const FORMAT_BY_PERIOD: Readonly<
  Record<GroupKeyPeriod, (fields: PeriodFieldsArgs) => string>
> = {
  day: ({ day, month, year }) =>
    `${pad({ length: 4, value: year })}-${pad({ length: 2, value: month })}-${pad({ length: 2, value: day })}`,
  month: ({ month, year }) =>
    `${pad({ length: 4, value: year })}-${pad({ length: 2, value: month })}`,
  quarter: ({ month, year }) =>
    `${pad({ length: 4, value: year })}-Q${Math.ceil(month / 3)}`,
  year: ({ year }) => pad({ length: 4, value: year }),
};

export const toGroupPeriodLabel = ({
  isZoned,
  period,
  value,
}: ToGroupPeriodLabelArgs): string | undefined => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return;

  const fields = isZoned
    ? {
        day: value.getUTCDate(),
        month: value.getUTCMonth() + 1,
        year: value.getUTCFullYear(),
      }
    : {
        day: value.getDate(),
        month: value.getMonth() + 1,
        year: value.getFullYear(),
      };

  return FORMAT_BY_PERIOD[period](fields);
};
