import type { ColumnOrderState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook.ts';

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

    const columnsState = columnsStore.get();

    const defaultOrder =
      columnsState?.columnOrder && columnsState.columnOrder.length > 0
        ? columnsState.columnOrder
        : (columnsState?.columns ?? []).map((col) => col.key);

    const sortedKeys = sorting.map((s) => s.columnKey);

    const remainingKeys = defaultOrder.filter(
      (key) => !sortedKeys.includes(key),
    );

    const columnOrder = [...sortedKeys, ...remainingKeys] as ColumnOrderState;

    columnsDrawerStore.set({ columnOrder });
  };
};
