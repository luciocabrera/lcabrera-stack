import type { GroupKeyPeriod } from '../group-query-builder/group-query-builder.types.ts';
import type { GroupKeyTruncation } from './olap.types.ts';

type ToGroupPeriodLabelArgs = GroupKeyTruncation & {
  readonly value: unknown;
};

const pad = (value: number, length: number) =>
  String(value).padStart(length, '0');

type PeriodFieldsArgs = {
  readonly day: number;
  readonly month: number;
  readonly year: number;
};

const FORMAT_BY_PERIOD: Readonly<
  Record<GroupKeyPeriod, (fields: PeriodFieldsArgs) => string>
> = {
  day: ({ day, month, year }) =>
    `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`,
  month: ({ month, year }) => `${pad(year, 4)}-${pad(month, 2)}`,
  quarter: ({ month, year }) => `${pad(year, 4)}-Q${Math.ceil(month / 3)}`,
  year: ({ year }) => pad(year, 4),
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
