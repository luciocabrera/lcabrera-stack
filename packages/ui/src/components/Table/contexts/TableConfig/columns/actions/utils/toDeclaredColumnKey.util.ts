import type { DataKey, TableColumn } from '#ui/components/Table/Table.types';

import { parseTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

type ToDeclaredColumnKeyArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columns: readonly TableColumn<TData>[];
};

/**
 * The **declared** column a key belongs to: a measure column resolves to the
 * column it measures, and every other key is already declared and passes
 * through.
 *
 * Column order, pinning and visibility are the user's own layout state — they
 * are persisted to a cookie and restored into a grid that may have no grouping
 * applied at all. `withAggregateColumns` is a derivation and its measure
 * columns exist only while a grouping does, so a measure key written into that
 * state is a preference about a column that will not exist next time. Keeping
 * the state declared-only is what makes ungrouping free, and what lets the
 * settings drawer offer a stable list.
 *
 * Acting on the source also does the right thing on screen: a measured column's
 * aggregates render as one band, and pinning half a band away from the other
 * half is not what "pin this column" means to the person clicking it. Pinning
 * `Average` pins `Total Amount`, so the whole band travels together.
 *
 * **A key that is itself a declared column always wins**, so a consumer whose
 * own column is literally named `total_amount:avg` is unaffected — the token
 * grammar never overrides a real column.
 */
export const toDeclaredColumnKey = <TData>({
  columnKey,
  columns,
}: ToDeclaredColumnKeyArgs<TData>): DataKey<TData> => {
  if (columns.some((column) => column.key === columnKey)) {
    return columnKey;
  }

  const aggregate = parseTableAggregateToken(String(columnKey));

  if (aggregate === undefined) {
    return columnKey;
  }

  const source = columns.find(
    (column) => String(column.key) === aggregate.columnKey,
  );

  return source?.key ?? columnKey;
};
