import type { ColumnOrderState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

/**
 * Hook to reorder columns based on current sorting.
 * Sorted columns come first (in their sort order),
 * remaining columns follow in their default/original order.
 */
export const useOrderColumnsBySorting = () => {
  const { columnsStore } = useTableConfigContextValue();
  const { columnsStore: columnsDrawerStore } = useTableDrawerContextValue();

  return () => {
    const drawerState = columnsDrawerStore.get();
    const sorting = drawerState?.sorting ?? [];

    // Get the default column order from the original table config
    const columnsState = columnsStore.get();

    const defaultOrder =
      columnsState?.columnOrder && columnsState.columnOrder.length > 0
        ? columnsState.columnOrder
        : (columnsState?.columns ?? []).map((col) => col.key);

    // Sorted columns come first, in their sort order
    const sortedKeys = sorting.map((s) => s.columnKey);

    // Remaining columns follow in their default order
    const remainingKeys = defaultOrder.filter(
      (key) => !sortedKeys.includes(key),
    );

    columnsDrawerStore.set({
      columnOrder: [...sortedKeys, ...remainingKeys] as ColumnOrderState,
    });
  };
};
