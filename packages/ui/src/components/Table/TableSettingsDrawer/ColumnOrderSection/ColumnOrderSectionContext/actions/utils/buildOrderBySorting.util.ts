import type {
  ColumnOrderState,
  SortingState,
} from '@lcabrera/ui/components/Table/Table.types';

import { restoreStaticColumnOrder } from '@lcabrera/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

type BuildOrderBySortingArgs<TData extends Record<string, unknown>> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly sorting: SortingState<TData>;
  readonly staticKeys: Set<string>;
};

/**
 * Moves the sorted columns to the front of `columnOrder`, leaving everything
 * else in its existing relative position and restoring static columns after.
 *
 * The result is always a permutation of `columnOrder`. A sort naming a column
 * the order does not contain is ignored rather than prepended: the order is
 * what columns exist, and a sort is only a preference over them. Such a key
 * never rendered either way — `getEffectiveColumns` resolves each order entry
 * to a column and drops the misses — so admitting one only wrote a dead key
 * into persisted state, and did so inconsistently: a static one was already
 * discarded by `restoreStaticColumnOrder`, which has no position to return it
 * to.
 */
export const buildOrderBySorting = <TData extends Record<string, unknown>>({
  columnOrder,
  sorting,
  staticKeys,
}: BuildOrderBySortingArgs<TData>) => {
  const orderedKeys = new Set<string>(columnOrder);
  const sortedKeys = sorting
    .filter((sort) => orderedKeys.has(sort.columnKey))
    .map((sort) => sort.columnKey);
  const sortedKeySet = new Set<string>(sortedKeys);
  const remainingKeys = columnOrder.filter((key) => !sortedKeySet.has(key));

  return restoreStaticColumnOrder({
    currentOrder: columnOrder,
    newOrder: [...sortedKeys, ...remainingKeys] as ColumnOrderState<TData>,
    staticKeys,
  });
};
