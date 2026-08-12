import type { TableAggregateFn } from '@lcabrera/ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '@lcabrera/ui/components/Table/Table.constants';

import { toOrderGroupLabel } from './toOrderGroupLabel.util';

/** One selected aggregate, paired with the alias the builder projected it under. */
type OrderGroupAggregate = {
  readonly alias: string;
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
};

type ToOrderGroupRowArgs = {
  /**
   * The selected aggregates. The alias comes from the builder's own result
   * rather than being spelled here, so the name the SQL projected and the name
   * this decodes by are one string.
   */
  readonly aggregates: readonly OrderGroupAggregate[];
  /** The group keys, in the query's nesting order. */
  readonly columnKeys: readonly string[];
  /** The alias the builder projected `count(*)` under. */
  readonly countAlias: string;
  readonly row: Record<string, unknown>;
};

/**
 * Turns one row of a grouped read into a row the table can render.
 *
 * Every value is formatted here rather than in the group-header row, because
 * only this side knows it is a Postgres value: `count(*)` arrives as a
 * **string** (`bigint` has no lossless JS number), a `numeric` aggregate arrives
 * as a string too, and a NULL key is a real group rather than a missing one.
 * The renderer receives finished labels and a number.
 *
 * The result carries the summary and nothing else. A grouped read projects only
 * the group keys and their aggregates, so there is no detail row hiding
 * underneath — claiming otherwise by copying a key into its own column would
 * make the row look partly like a data row to every cell renderer.
 */
export const toOrderGroupRow = ({
  aggregates,
  columnKeys,
  countAlias,
  row,
}: ToOrderGroupRowArgs) => {
  const count = Number(row[countAlias]);

  return {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: aggregates.map(({ alias, columnKey, fn }) => ({
        columnKey,
        fn,
        label: toOrderGroupLabel(row[alias]),
      })),
      count: Number.isFinite(count) ? count : 0,
      path: columnKeys.map((columnKey) => ({
        columnKey,
        label: toOrderGroupLabel(row[columnKey]),
      })),
    },
  };
};
