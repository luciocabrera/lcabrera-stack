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

export const buildOrderBySorting = <TData extends Record<string, unknown>>({
  columnOrder,
  sorting,
  staticKeys,
}: BuildOrderBySortingArgs<TData>) => {
  const sortedKeys = sorting.map((sort) => sort.columnKey);
  const remainingKeys = columnOrder.filter((key) => !sortedKeys.includes(key));

  return restoreStaticColumnOrder({
    currentOrder: columnOrder,
    newOrder: [...sortedKeys, ...remainingKeys] as ColumnOrderState<TData>,
    staticKeys,
  });
};
