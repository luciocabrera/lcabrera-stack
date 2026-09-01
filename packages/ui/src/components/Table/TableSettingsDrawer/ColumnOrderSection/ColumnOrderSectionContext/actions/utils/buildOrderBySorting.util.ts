import type {
  ColumnOrderState,
  SortingState,
} from '#ui/components/Table/Table.types';

import { restoreStaticColumnOrder } from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

type BuildOrderBySortingArgs<TData extends Record<string, unknown>> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly sorting: SortingState<TData>;
  readonly staticKeys: Set<string>;
};

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
