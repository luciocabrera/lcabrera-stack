import type { ColumnOrderState } from '@/components/Table/Table.types';
import type { OrderConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { resolvePinOrderConflict } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
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
    const columns = tableColumnsState?.columns ?? [];
    const staticKeys = new Set<string>(
      columns.filter((col) => col.isStatic).map((col) => col.key),
    );

    let finalOrder = result.columnOrder;
    let finalPinning = result.columnPinning;

    if (staticKeys.size > 0) {
      // Restore static columns to their original positions
      const currentOrder =
        drawerColumnsStore.get()?.columnOrder ?? ([] as ColumnOrderState);

      if (currentOrder.length > 0) {
        const withoutStatic = finalOrder.filter((key) => !staticKeys.has(key));
        const staticPositions = currentOrder
          .map((key, index) =>
            staticKeys.has(key) ? { index, key } : undefined,
          )
          .filter((entry) => entry !== undefined);

        for (const { index, key } of staticPositions) {
          withoutStatic.splice(index, 0, key);
        }

        finalOrder = withoutStatic as ColumnOrderState;
      }

      // Restore default pinning for static columns
      const defaultPinning = tableColumnsState?.columnPinning ?? {
        left: [],
        right: [],
      };

      for (const key of staticKeys) {
        if (
          defaultPinning.left.includes(key) &&
          !finalPinning.left.includes(key)
        ) {
          finalPinning = {
            ...finalPinning,
            left: [...finalPinning.left, key],
          };
        }
        if (
          defaultPinning.right.includes(key) &&
          !finalPinning.right.includes(key)
        ) {
          finalPinning = {
            ...finalPinning,
            right: [...finalPinning.right, key],
          };
        }
      }
    }

    drawerColumnsStore.set({
      columnOrder: finalOrder,
      columnPinning: finalPinning,
    });
    modalsStore.set({
      orderConflict: { ...orderConflict, isOpen: false },
    });
  };
};
