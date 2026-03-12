import type { DraggableItem } from '@/components/DraggableList';
import type { ColumnOrderState } from '@/components/Table/Table.types';

import {
  detectPinOrderConflict,
  recalculatePinSides,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

/**
 * Hook to handle column reordering via drag and drop.
 * Recalculates pin sides and detects conflicts.
 */
export const useReorderColumns = () => {
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();

  return (reorderedItems: DraggableItem[]) => {
    const columnPinning = drawerColumnsStore.get()?.columnPinning ?? {
      left: [],
      right: [],
    };

    const newColumnOrder = reorderedItems.map(
      (item) => item.id,
    ) as ColumnOrderState;

    const recalculatedPinning = recalculatePinSides({
      columnPinning,
      newOrder: newColumnOrder,
    });

    if (
      !detectPinOrderConflict({
        columnPinning: recalculatedPinning,
        newOrder: newColumnOrder,
      })
    ) {
      drawerColumnsStore.set({
        columnOrder: newColumnOrder,
        columnPinning: recalculatedPinning,
      });
      return;
    }

    modalsStore.set({
      orderConflict: {
        description:
          'Dragging this column broke the pinning layout. Pinned columns must stay at the edges. Choose how to proceed:',
        isOpen: true,
        pendingOrder: newColumnOrder,
        pendingPinning: recalculatedPinning,
      },
    });
  };
};
