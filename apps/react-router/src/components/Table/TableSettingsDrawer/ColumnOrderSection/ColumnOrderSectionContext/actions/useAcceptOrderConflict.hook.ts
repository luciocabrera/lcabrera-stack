import type { ColumnOrderState } from '@/components/Table/Table.types';
import type { OrderConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  resolvePinOrderConflict,
  restoreStaticColumnOrder,
  restoreStaticPinnedColumns,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

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

    const result = resolvePinOrderConflict({
      columnPinning: orderConflict.pendingPinning,
      newOrder: orderConflict.pendingOrder,
      resolution,
    });

    const tableColumnsState = tableColumnsStore.get();
    const staticKeys = tableColumnsState?.staticKeys ?? new Set<string>();
    const currentOrder =
      drawerColumnsStore.get()?.columnOrder ?? ([] as ColumnOrderState);

    const finalOrder = restoreStaticColumnOrder({
      currentOrder,
      newOrder: result.columnOrder,
      staticKeys,
    });

    const defaultPinning = tableColumnsState?.columnPinning ?? {
      left: [],
      right: [],
    };

    const finalPinning = restoreStaticPinnedColumns({
      defaultPinning,
      finalPinning: result.columnPinning,
      staticKeys,
    });

    drawerColumnsStore.set({
      columnOrder: finalOrder,
      columnPinning: finalPinning,
    });
    modalsStore.set({
      orderConflict: { ...orderConflict, isOpen: false },
    });
  };
};
