import type { ColumnOrderState } from '@/components/Table/Table.types';
import type { PinConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  applyPin,
  buildAllOrderedColumns,
  insertAdjacentToPinnedGroup,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

/**
 * Hook to handle accepting a pin conflict resolution.
 */
export const useAcceptPinConflict = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();

  return (resolution: PinConflictResolution) => {
    const conflictModal = modalsStore.get()?.conflictModal;
    if (!conflictModal) return;

    const columns = tableColumnsStore.get()?.columns ?? [];
    const drawerState = drawerColumnsStore.get();
    const columnsOrder = drawerState?.columnOrder ?? ([] as ColumnOrderState);
    const columnPinning = drawerState?.columnPinning ?? { left: [], right: [] };

    const { columnKey, side } = conflictModal;
    const allOrderedColumns = buildAllOrderedColumns({
      columns,
      columnsOrder,
    });
    const index = allOrderedColumns.findIndex((col) => col.key === columnKey);

    switch (resolution) {
      case 'move-column': {
        const newOrder = allOrderedColumns
          .filter((col) => col.key !== columnKey)
          .map((col) => col.key);
        const column = allOrderedColumns[index];
        if (column?.key) {
          insertAdjacentToPinnedGroup({
            columnKey: column.key,
            columnPinning,
            order: newOrder,
            side,
          });
        }

        drawerColumnsStore.set({
          columnOrder: newOrder as ColumnOrderState,
          columnPinning: applyPin({ columnKey, columnPinning, side }),
        });
        break;
      }

      case 'pin-all-between': {
        const newPinning = {
          left: [...columnPinning.left],
          right: [...columnPinning.right],
        };

        if (side === 'left') {
          for (let i = 0; i <= index; i++) {
            const key = allOrderedColumns[i]?.key ?? '';
            if (!newPinning.left.includes(key)) {
              newPinning.right = newPinning.right.filter((k) => k !== key);
              newPinning.left.push(key);
            }
          }
        } else {
          for (let i = index; i < allOrderedColumns.length; i++) {
            const key = allOrderedColumns[i]?.key ?? '';
            if (!newPinning.right.includes(key)) {
              newPinning.left = newPinning.left.filter((k) => k !== key);
              newPinning.right.push(key);
            }
          }
        }

        drawerColumnsStore.set({ columnPinning: newPinning });
        break;
      }

      case 'pin-only': {
        drawerColumnsStore.set({
          columnPinning: applyPin({ columnKey, columnPinning, side }),
        });
        break;
      }
    }

    modalsStore.set({
      conflictModal: { ...conflictModal, isOpen: false },
    });
  };
};
