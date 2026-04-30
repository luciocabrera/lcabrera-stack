import type { ColumnOrderState } from '@/components/Table/Table.types';
import type { PinConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  applyPin,
  buildAllOrderedColumns,
  insertAdjacentToPinnedGroup,
  pinAllBetween,
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

    const tableState = tableColumnsStore.get();
    const columns = tableState?.columns ?? [];
    const staticKeys = tableState?.staticKeys;
    const drawerState = drawerColumnsStore.get();
    const columnsOrder = drawerState?.columnOrder ?? ([] as ColumnOrderState);
    const columnPinning = drawerState?.columnPinning ?? { left: [], right: [] };

    const { columnKey, side } = conflictModal;
    const allOrderedColumns = buildAllOrderedColumns({
      columns,
      columnsOrder,
    });
    const index = allOrderedColumns.findIndex((col) => col.key === columnKey);

    if (resolution === 'move-column') {
      let newOrder = allOrderedColumns
        .filter((col) => col.key !== columnKey)
        .map((col) => col.key);
      const column = allOrderedColumns[index];

      if (column?.key) {
        newOrder = insertAdjacentToPinnedGroup({
          columnKey: column.key,
          columnPinning,
          order: newOrder,
          side,
        });
      }

      drawerColumnsStore.set({
        columnOrder: newOrder as ColumnOrderState,
        columnPinning: applyPin({
          columnKey,
          columnPinning,
          side,
          staticKeys,
        }),
      });
    } else if (resolution === 'pin-all-between') {
      drawerColumnsStore.set({
        columnPinning: pinAllBetween({
          allOrderedKeys: allOrderedColumns.map((column) => column.key),
          columnPinning,
          index,
          side,
        }),
      });
    } else {
      drawerColumnsStore.set({
        columnPinning: applyPin({
          columnKey,
          columnPinning,
          side,
          staticKeys,
        }),
      });
    }

    modalsStore.set({
      conflictModal: { ...conflictModal, isOpen: false },
    });
  };
};
