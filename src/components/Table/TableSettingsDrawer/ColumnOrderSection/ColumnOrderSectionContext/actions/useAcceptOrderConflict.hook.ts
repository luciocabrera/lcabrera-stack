import type { OrderConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { resolvePinOrderConflict } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

/**
 * Hook to handle accepting an order conflict resolution.
 */
export const useAcceptOrderConflict = () => {
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();

  return (resolution: OrderConflictResolution) => {
    const orderConflict = modalsStore.get()?.orderConflict;
    if (!orderConflict) return;

    const result = resolvePinOrderConflict({
      columnPinning: orderConflict.pendingPinning,
      newOrder: orderConflict.pendingOrder,
      resolution,
    });

    drawerColumnsStore.set({
      columnOrder: result.columnOrder,
      columnPinning: result.columnPinning,
    });
    modalsStore.set({
      orderConflict: { ...orderConflict, isOpen: false },
    });
  };
};
