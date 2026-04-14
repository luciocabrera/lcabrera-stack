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

type PinSide = 'left' | 'right';

const pinAllBetween = ({
  allOrderedKeys,
  columnPinning,
  index,
  side,
}: {
  readonly allOrderedKeys: readonly string[];
  readonly columnPinning: {
    readonly left: readonly string[];
    readonly right: readonly string[];
  };
  readonly index: number;
  readonly side: PinSide;
}) => {
  const next = {
    left: [...columnPinning.left],
    right: [...columnPinning.right],
  };

  if (side === 'left') {
    for (const key of allOrderedKeys.slice(0, index + 1)) {
      if (!next.left.includes(key)) {
        next.right = next.right.filter((pinnedKey) => pinnedKey !== key);
        next.left.push(key);
      }
    }

    return next;
  }

  for (const key of allOrderedKeys.slice(index)) {
    if (!next.right.includes(key)) {
      next.left = next.left.filter((pinnedKey) => pinnedKey !== key);
      next.right.push(key);
    }
  }

  return next;
};

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
          side: side as PinSide,
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
