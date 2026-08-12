import { TABLE_GROUP_ROW_FIELD } from '@lcabrera/ui/components/Table/Table.constants';

import { toOrderGroupLabel } from './toOrderGroupLabel.util';

type ToOrderGroupRowArgs = {
  readonly columnKey: string;
  /** The alias the builder projected `count(*)` under, taken from its result. */
  readonly countAlias: string;
  readonly row: Record<string, unknown>;
};

/**
 * Turns one row of a grouped read into a row the table can render.
 *
 * The key value is formatted here rather than in the group-header row, because
 * only this side knows it is a Postgres value: `count(*)` arrives as a **string**
 * (`bigint` has no lossless JS number), and a NULL key is a real group rather
 * than a missing one. The renderer receives a finished label and a number.
 *
 * The result carries the summary and nothing else. A grouped read projects only
 * the group key and its aggregates, so there is no detail row hiding underneath
 * — claiming otherwise by copying the key into its own column would make the
 * row look partly like a data row to every cell renderer.
 */
export const toOrderGroupRow = ({
  columnKey,
  countAlias,
  row,
}: ToOrderGroupRowArgs) => {
  const count = Number(row[countAlias]);

  return {
    [TABLE_GROUP_ROW_FIELD]: {
      columnKey,
      count: Number.isFinite(count) ? count : 0,
      label: toOrderGroupLabel(row[columnKey]),
    },
  };
};
