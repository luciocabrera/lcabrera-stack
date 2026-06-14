import type { ColumnOrderState } from '@/components/Table/Table.types';
import type { OrderConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { resolveAcceptedOrderConflictState } from './utils/resolveAcceptedOrderConflictState.util';
import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

/**
 * Hook to handle accepting an order conflict resolution.
 * Static columns are preserved in their original positions and pinning.
 */
export const useAcceptOrderConflict = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();

  return (resolution: OrderConflictResolution) => {
    const orderConflict = modalsStore.get()?.orderConflict;
    if (!orderConflict) return;

    const tableColumnsState = tableColumnsStore.get();
    const staticKeys = tableColumnsState?.staticKeys ?? new Set<string>();
    const currentOrder =
      drawerColumnsStore.get()?.columnOrder ?? ([] as ColumnOrderState);

    const defaultPinning = tableColumnsState?.columnPinning ?? {
      left: [],
      right: [],
    };

    const resolvedState = resolveAcceptedOrderConflictState({
      currentOrder,
      defaultPinning,
      pendingOrder: orderConflict.pendingOrder,
      pendingPinning: orderConflict.pendingPinning,
      resolution,
      staticKeys,
    });

    drawerColumnsStore.set({
      columnOrder: resolvedState.columnOrder,
      columnPinning: resolvedState.columnPinning,
    });
    modalsStore.set({
      orderConflict: { ...orderConflict, isOpen: false },
    });
  };
};
