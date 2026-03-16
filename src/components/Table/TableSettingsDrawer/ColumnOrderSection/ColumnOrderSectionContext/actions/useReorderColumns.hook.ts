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
    const staticKeys = new Set<string>(
      columns.filter((col) => col.isStatic).map((col) => col.key),
    );

    const drawerColumnsState = drawerColumnsStore.get();
    const currentOrder = drawerColumnsState?.columnOrder ?? ([] as ColumnOrderState);

    let finalOrder = reorderedItems.map((item) => item.id) as ColumnOrderState;

    // Restore static columns to their original positions
    if (staticKeys.size > 0 && currentOrder.length > 0) {
      const withoutStatic = finalOrder.filter((key) => !staticKeys.has(key));
      const staticPositions = currentOrder
        .map((key, index) => (staticKeys.has(key) ? { index, key } : undefined))
        .filter((entry) => entry !== undefined);

      for (const { index, key } of staticPositions) {
        withoutStatic.splice(index, 0, key);
      }

      finalOrder = withoutStatic as ColumnOrderState;
    }

    const columnPinning = drawerColumnsState?.columnPinning ?? {
      left: [],
      right: [],
    };

    const recalculatedPinning = recalculatePinSides({
      columnPinning,
      newOrder: finalOrder,
    });

    if (
      !detectPinOrderConflict({
        columnPinning: recalculatedPinning,
        newOrder: finalOrder,
      })
    ) {
      drawerColumnsStore.set({
        columnOrder: finalOrder,
        columnPinning: recalculatedPinning,
      });
      return;
    }

    modalsStore.set({
      orderConflict: {
        description:
          'Dragging this column broke the pinning layout. Pinned columns must stay at the edges. Choose how to proceed:',
        isOpen: true,
        pendingOrder: finalOrder,
        pendingPinning: recalculatedPinning,
      },
    });
  };
};
