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
 * **Hiding needs it for a sharper reason than pinning does.** The settings
 * drawer builds its rows from the declared columns, so a derived key written
 * into the persisted `columnVisibility` is one nothing in the per-column UI can
 * remove again — only the blanket "Clear Visibility & Pinning", which discards
 * every other preference too. Hiding a band whole is the cost; #883 adds
 * per-measure hiding the way it has to be added, by teaching the drawer to
 * offer those columns rather than by writing an unreachable key.
 *
 * **A key that is itself a declared column always wins**, so a consumer whose
 * own column is literally named `total_amount:avg` is unaffected — the token
 * grammar never overrides a real column.
 *
 * **Guard on the result, never on the argument.** Every per-column permission
 * in the table is keyed by declared column — `staticKeys` is built from the
 * consumer's own list and cannot contain a derived key — so a check that runs
 * before this mapping tests a key no permission set was ever built for, passes
 * whatever the answer should be, and then acts on the source column anyway.
 * That is a lock with a way around it rather than a lock. `useSetColumnPinning`
 * gets it right by construction, since `resolveColumnPinningUpdate` receives
 * the already-mapped key; `useSetColumnVisibility` has to order the two by
 * hand, and once did not.
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
