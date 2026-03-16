import type { DraggableItem } from '@/components/DraggableList';
import type { ColumnOrderState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  detectPinOrderConflict,
  recalculatePinSides,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

/**
 * Hook to handle column reordering via drag and drop.
 * Recalculates pin sides and detects conflicts.
 * Static columns are preserved in their original positions.
 */
export const useReorderColumns = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();

  return (reorderedItems: DraggableItem[]) => {
    const columns = tableColumnsStore.get()?.columns ?? [];
    const staticKeys = new Set(
      columns.filter((col) => col.isStatic).map((col) => col.key),
    );

    // If any static column changed position, restore original positions
    const currentOrder = drawerColumnsStore.get()?.columnOrder ?? ([] as ColumnOrderState);
    if (staticKeys.size > 0 && currentOrder.length > 0) {
      const reorderedOrder = reorderedItems.map((item) => item.id);
      const hasStaticMoved = [...staticKeys].some((key) => {
        const originalIndex = currentOrder.indexOf(key);
        const newIndex = reorderedOrder.indexOf(key);
        return originalIndex !== -1 && newIndex !== -1 && originalIndex !== newIndex;
      });
      if (hasStaticMoved) return;
    }

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
