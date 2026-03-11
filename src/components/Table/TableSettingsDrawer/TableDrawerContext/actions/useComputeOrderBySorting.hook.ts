import type { ColumnOrderState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * Hook to compute the column order based on current sorting,
 * without applying it. Sorted columns come first (in their sort order),
 * remaining columns follow in their default/original order.
 */
export const useComputeOrderBySorting = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnsStore: columnsDrawerStore } = useTableDrawerContextValue();

  return (): ColumnOrderState => {
    const drawerState = columnsDrawerStore.get();
    const sorting = drawerState?.sorting ?? [];

    const columnsState = columnsStore.get();

    const defaultOrder =
      columnsState?.columnOrder && columnsState.columnOrder.length > 0
        ? columnsState.columnOrder
        : (columnsState?.columns ?? []).map((col) => col.key);

    const sortedKeys = sorting.map((s) => s.columnKey);

    const remainingKeys = defaultOrder.filter(
      (key) => !sortedKeys.includes(key),
    );

    return [...sortedKeys, ...remainingKeys] as ColumnOrderState;
  };
};
