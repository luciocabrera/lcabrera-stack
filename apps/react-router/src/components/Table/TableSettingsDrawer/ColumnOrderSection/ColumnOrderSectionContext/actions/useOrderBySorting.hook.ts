import type {
  ColumnOrderState,
  SortingState,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { restoreStaticColumnOrder } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';
import { resolveOrderConflictUpdate } from './utils/resolveOrderConflictUpdate.util';

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
    const drawerState = drawerColumnsStore.get();
    const sorting = drawerState?.sorting ?? ([] as SortingState);
    const columnsOrder = drawerState?.columnOrder ?? ([] as ColumnOrderState);
    const columnPinning = drawerState?.columnPinning ?? { left: [], right: [] };
    const staticKeys = tableColumnsStore.get()?.staticKeys ?? new Set<string>();

    const sortedKeys = sorting.map((s) => s.columnKey);
    const remainingKeys = columnsOrder.filter(
      (key) => !sortedKeys.includes(key),
    );

    const newOrder = restoreStaticColumnOrder({
      currentOrder: columnsOrder,
      newOrder: [...sortedKeys, ...remainingKeys] as ColumnOrderState,
      staticKeys,
    });

    const resolvedUpdate = resolveOrderConflictUpdate({
      columnPinning,
      conflictDescription:
        'Reordering columns by sorting will move pinned columns out of their pinned positions. Choose how to proceed:',
      newOrder,
      staticKeys,
    });

    if (resolvedUpdate.kind === 'apply-order') {
      drawerColumnsStore.set({ columnOrder: newOrder });
      return;
    }

    modalsStore.set({
      orderConflict: resolvedUpdate.orderConflict,
    });
  };
};
