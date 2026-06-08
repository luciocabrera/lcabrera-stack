import type { DraggableItem } from '@/components/DraggableList';
import type { ColumnOrderState } from '@/components/Table/Table.types';

import { useGetGlobalOrderConflictResolutionPreference } from '@/contexts/GlobalSettingsContext/selectors';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  detectPinOrderConflict,
  recalculatePinSides,
  restoreStaticColumnOrder,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

import { useAcceptOrderConflict } from './useAcceptOrderConflict.hook';

/**
 * Hook to handle column reordering via drag and drop.
 * Recalculates pin sides and detects conflicts.
 * Static columns are preserved in their original positions.
 */
export const useReorderColumns = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();
  const orderConflictResolutionPreference =
    useGetGlobalOrderConflictResolutionPreference();
  const acceptOrderConflict = useAcceptOrderConflict();

  return (reorderedItems: DraggableItem[]) => {
    const drawerColumnsState = drawerColumnsStore.get();
    const currentOrder =
      drawerColumnsState?.columnOrder ?? ([] as ColumnOrderState);
    const staticKeys = tableColumnsStore.get()?.staticKeys ?? new Set<string>();

    const finalOrder = restoreStaticColumnOrder({
      currentOrder,
      newOrder: reorderedItems.map((item) => item.id) as ColumnOrderState,
      staticKeys,
    });

    const columnPinning = drawerColumnsState?.columnPinning ?? {
      left: [],
      right: [],
    };

    const recalculatedPinning = recalculatePinSides({
      columnPinning,
      newOrder: finalOrder,
      staticKeys,
    });

    if (
      !detectPinOrderConflict({
        columnPinning: recalculatedPinning,
        newOrder: finalOrder,
        staticKeys,
      })
    ) {
      drawerColumnsStore.set({
        columnOrder: finalOrder,
        columnPinning: recalculatedPinning,
      });
      return;
    }

    const orderConflict = {
      description:
        'Dragging this column broke the pinning layout. Pinned columns must stay at the edges. Choose how to proceed:',
      isOpen: !orderConflictResolutionPreference,
      pendingOrder: finalOrder,
      pendingPinning: recalculatedPinning,
    };

    modalsStore.set({
      orderConflict,
    });

    if (orderConflictResolutionPreference) {
      acceptOrderConflict(orderConflictResolutionPreference);
    }
  };
};
