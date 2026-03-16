import type {
  ColumnOrderState,
  SortingState,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { detectPinOrderConflict } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

/**
 * Hook to order columns by current sorting state.
 * Detects pin conflicts and opens the order conflict modal if needed.
 * Static columns are preserved in their original positions.
 */
export const useOrderBySorting = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();

  return () => {
    const columns = tableColumnsStore.get()?.columns ?? [];
    const staticKeys = new Set<string>(
      columns.filter((col) => col.isStatic).map((col) => col.key),
    );

    const drawerState = drawerColumnsStore.get();
    const sorting = drawerState?.sorting ?? ([] as SortingState);
    const columnsOrder = drawerState?.columnOrder ?? ([] as ColumnOrderState);
    const columnPinning = drawerState?.columnPinning ?? { left: [], right: [] };

    const sortedKeys = sorting.map((s) => s.columnKey);
    const remainingKeys = columnsOrder.filter(
      (key) => !sortedKeys.includes(key),
    );
    let newOrder = [...sortedKeys, ...remainingKeys] as ColumnOrderState;

    // Restore static columns to their original positions
    if (staticKeys.size > 0 && columnsOrder.length > 0) {
      const withoutStatic = newOrder.filter((key) => !staticKeys.has(key));
      const staticPositions = columnsOrder
        .map((key, index) => (staticKeys.has(key) ? { index, key } : undefined))
        .filter((entry) => entry !== undefined);

      for (const { index, key } of staticPositions) {
        withoutStatic.splice(index, 0, key);
      }

      newOrder = withoutStatic as ColumnOrderState;
    }

    if (!detectPinOrderConflict({ columnPinning, newOrder })) {
      drawerColumnsStore.set({ columnOrder: newOrder });
      return;
    }

    modalsStore.set({
      orderConflict: {
        description:
          'Reordering columns by sorting will move pinned columns out of their pinned positions. Choose how to proceed:',
        isOpen: true,
        pendingOrder: newOrder,
        pendingPinning: columnPinning,
      },
    });
  };
};
