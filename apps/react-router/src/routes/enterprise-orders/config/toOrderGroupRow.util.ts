import type { TableAggregateFn } from '@lcabrera/ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '@lcabrera/ui/components/Table/Table.constants';

import { toOrderGroupLabel } from './toOrderGroupLabel.util';

type IsKeyRolledUpArgs = {
  readonly index: number;
  readonly keyCount: number;
  readonly mask: number;
};

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
  /** The alias the builder projected `GROUPING(k₁, …, kₙ)` under. */
  readonly maskAlias: string;
  readonly row: Record<string, unknown>;
};

/**
 * Whether key `index` of `keyCount` was rolled up in this row's grouping set.
 *
 * `GROUPING(k₁, …, kₙ)` puts the **first** key in the most significant bit, so
 * key `i` owns `2 ** (n - 1 - i)`. Read by division rather than with a bitwise
 * `&` because the two agree exactly at this size — the depth cap keeps the mask
 * under 16 — and the arithmetic form says which bit is being read without the
 * reader having to know the operator's precedence.
 */
const isKeyRolledUp = ({ index, keyCount, mask }: IsKeyRolledUpArgs) =>
  Math.trunc(mask / 2 ** (keyCount - 1 - index)) % 2 === 1;

/**
 * Turns one row of a grouped read into a row the table can render.
 *
 * **The mask is what makes a rollup readable, and this is where it is decoded.**
 * A row whose `shipping_country` is NULL is either a real NULL in the data or
 * the subtotal across every country, and the two are textually identical — only
 * `GROUPING()` separates them. A set bit means "this row is not keyed by that
 * column", never "no value here".
 *
 * The decode produces two things the renderer needs and cannot derive:
 *
 * - **`path` holds only the keys this row is actually grouped by.** A rollup
 *   emits sets that are prefixes of the key list, so dropping the rolled-up
 *   keys leaves a prefix whose length is the row's depth — what the hierarchy
 *   column indents by (ADR-065). The grand total rolls up every key and gets an
 *   empty path.
 * - **`isSubtotal`** — whether anything was rolled up at all. A flat read never
 *   sets a bit, so every row is a leaf and this stays `false` throughout, which
 *   is byte for byte the behaviour before rollup existed.
 *
 * **Keys are formatted here; aggregates are not.** Only this side knows a key
 * is a Postgres value — a NULL key is a real group rather than a missing one —
 * and nothing downstream can resolve a key back to the column it came from. An
 * aggregate is the opposite case: it names its column, so the cell that renders
 * it can ask the columns store for that column's `dataType` and `format` and
 * render it exactly as the cells beneath it. Formatting one here is how a
 * `numeric` sum reached a currency column as `"302540833.38"` — `pg` hands
 * `numeric` and `bigint` back as strings, and this side has nothing better to
 * do with one than pass it along. So it passes it along raw instead.
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
  maskAlias,
  row,
}: ToOrderGroupRowArgs) => {
  const count = Number(row[countAlias]);
  const mask = Number(row[maskAlias]);
  // A mask that did not arrive as a number decodes as "nothing rolled up" —
  // the flat reading, and the only one that cannot invent a subtotal.
  const groupingMask = Number.isFinite(mask) ? mask : 0;

  const groupedKeys = columnKeys.filter(
    (_columnKey, index) =>
      !isKeyRolledUp({
        index,
        keyCount: columnKeys.length,
        mask: groupingMask,
      }),
  );

  return {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: aggregates.map(({ alias, columnKey, fn }) => ({
        columnKey,
        fn,
        value: row[alias],
      })),
      count: Number.isFinite(count) ? count : 0,
      isSubtotal: groupedKeys.length < columnKeys.length,
      path: groupedKeys.map((columnKey) => ({
        columnKey,
        label: toOrderGroupLabel(row[columnKey]),
      })),
    },
  };
};
