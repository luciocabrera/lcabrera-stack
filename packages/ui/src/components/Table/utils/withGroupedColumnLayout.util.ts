import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  DataKey,
  TableColumn,
} from '../Table.types';

type WithGroupedColumnLayoutArgs<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly groupingKeys: readonly string[];
};

/**
 * The four column inputs the view state is derived from, with the group-key
 * columns hoisted to the head of the painted grid while grouping is applied —
 * and returned unchanged while it is not (ADR-080).
 *
 * **No column is created.** The grid-owned hierarchy column this replaces was a
 * synthetic column carrying an indented label; a group row now states each
 * key's value in that key's own column, so a grouped row paints exactly the
 * columns the consumer declared and one cell fewer than before.
 *
 * Three inputs are rewritten and each one is load-bearing:
 *
 * - `columnOrder`, so the keys lead the order. `orderColumnsByKeys` respects
 *   it, and a key left where the user last dragged it could sit anywhere.
 * - `columnPinning.left`, so they are left-pinned and stay put while the
 *   measures scroll — the property that keeps a group row attached to what it
 *   is a group of. A key already pinned **right** is moved, not duplicated.
 * - `columnVisibility`, so a key cannot be hidden. Under one column per key a
 *   hidden key erases a level rather than merely hiding a column, and the depth
 *   signal is which columns are filled.
 *
 * **The hoist alone is sufficient — the ladder cannot be broken.**
 * `getEffectiveColumns` filters by visibility, orders by `columnOrder`, then
 * partitions by pinning, and `splitColumnsByPinning` derives each partition
 * from that already-ordered list. Keys at the head of both inputs therefore
 * land at indices `0…N-1` of the painted grid, ahead of anything the user
 * pinned, whatever their saved order says. **No column can sit between two
 * group keys**, which is the failure mode ADR-065 rejected reading B over, and
 * no gesture can put one there — so a drag never becomes a re-key.
 *
 * **This is a derivation, never state.** The store keeps the consumer's
 * `columns`, `columnOrder`, `columnPinning` and `columnVisibility` exactly as
 * they arrived, so none of this reaches the cookie the layout persists through
 * and ungrouping restores the user's layout because the layout was never
 * modified.
 *
 * A key naming no declared column is skipped rather than hoisted — the honest
 * answer for a URL naming a column this route does not render, and the same
 * fallback a group summary's own labels take.
 */
export const withGroupedColumnLayout = <TData>({
  columnOrder,
  columnPinning,
  columns,
  columnVisibility,
  groupingKeys,
}: WithGroupedColumnLayoutArgs<TData>) => {
  const unchanged = { columnOrder, columnPinning, columns, columnVisibility };

  if (groupingKeys.length === 0) return unchanged;

  const declared = new Set(columns.map((column) => String(column.key)));
  const keys = groupingKeys.filter((groupKey) => declared.has(groupKey));

  if (keys.length === 0) return unchanged;

  const isGroupKey = new Set(keys);
  const hoisted = keys as readonly DataKey<TData>[];
  const withoutKeys = (list: readonly DataKey<TData>[]) =>
    list.filter((key) => !isGroupKey.has(String(key)));

  const hiddenKeys = [...columnVisibility].filter((key) =>
    isGroupKey.has(String(key)),
  );

  return {
    columnOrder: [...hoisted, ...withoutKeys(columnOrder)],
    columnPinning: {
      left: [...hoisted, ...withoutKeys(columnPinning.left)],
      right: withoutKeys(columnPinning.right),
    },
    columns,
    // Reallocated only when a key is actually hidden, so an ordinary grouped
    // render keeps the store's own Set and the memo below it stays stable.
    columnVisibility:
      hiddenKeys.length === 0
        ? columnVisibility
        : new Set(
            [...columnVisibility].filter((key) => !isGroupKey.has(String(key))),
          ),
  };
};
