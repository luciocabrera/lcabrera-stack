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

/**
 * A truncated group key's heading — `2021`, `2021-Q2`, `2021-06`, `2021-06-14`
 * (#786).
 *
 * `toGroupLabel`'s ISO form is right for a raw timestamp and wrong for a period:
 * a month group would read `2021-06-01T00:00:00.000Z`, which states a day and an
 * instant the group is not about, and sorts a reader's eye past the part that
 * distinguishes it.
 *
 * **It is also the only correct reading of the value.** A `date` or `timestamp`
 * key is truncated zone-free and arrives as a `Date` holding those wall-clock
 * fields in the **local** zone, so `toISOString()` on a January group returns
 * the previous December under any positive offset — a heading naming the wrong
 * month. Reading the fields back in the frame they were written in is what fixes
 * that, and it is why `isZoned` travels with the period rather than being
 * inferred here.
 *
 * Still locale-free and still sortable, which is what `toGroupLabel` documents
 * as a heading's job — a localised month name belongs to the cell renderer.
 */
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
