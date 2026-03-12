import type {
  ColumnOrderState,
  SortingState,
} from '@/components/Table/Table.types';

import { detectPinOrderConflict } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

/**
 * Hook to order columns by current sorting state.
 * Detects pin conflicts and opens the order conflict modal if needed.
 */
export const useOrderBySorting = () => {
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();

  return () => {
    const drawerState = drawerColumnsStore.get();
    const sorting = drawerState?.sorting ?? ([] as SortingState);
    const columnsOrder = drawerState?.columnOrder ?? ([] as ColumnOrderState);
    const columnPinning = drawerState?.columnPinning ?? { left: [], right: [] };

    const sortedKeys = sorting.map((s) => s.columnKey);
    const remainingKeys = columnsOrder.filter(
      (key) => !sortedKeys.includes(key),
    );
    const newOrder = [...sortedKeys, ...remainingKeys] as ColumnOrderState;

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
