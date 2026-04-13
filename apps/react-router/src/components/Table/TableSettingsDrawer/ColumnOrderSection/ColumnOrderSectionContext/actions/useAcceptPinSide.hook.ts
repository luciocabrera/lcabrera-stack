import type { ColumnOrderState } from '@/components/Table/Table.types';
import type { PinSide } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  applyPin,
  buildAllOrderedColumns,
  getIsContiguousPin,
  resolveClosestEdgeSide,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook.ts';

/**
 * Hook to handle accepting a pin side selection from the PinSideModal.
 */
export const useAcceptPinSide = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();

  return (pinSide: PinSide) => {
    const pinSideModal = modalsStore.get()?.pinSideModal;
    if (!pinSideModal) return;

    const tableState = tableColumnsStore.get();
    const columns = tableState?.columns ?? [];
    const staticKeys = tableState?.staticKeys;
    const drawerState = drawerColumnsStore.get();
    const columnsOrder = drawerState?.columnOrder ?? ([] as ColumnOrderState);
    const columnPinning = drawerState?.columnPinning ?? { left: [], right: [] };

    const { columnKey } = pinSideModal;
    const allOrderedColumns = buildAllOrderedColumns({
      columns,
      columnsOrder,
    });
    const side = resolveClosestEdgeSide({
      allOrderedColumns,
      columnKey,
      pinSide,
    });

    const isContiguousPin = getIsContiguousPin({
      allOrderedColumns,
      columnKey,
      columnPinning,
      side,
    });

    if (isContiguousPin) {
      drawerColumnsStore.set({
        columnPinning: applyPin({ columnKey, columnPinning, side, staticKeys }),
      });
    } else {
      const col = allOrderedColumns.find((c) => c.key === columnKey);
      modalsStore.set({
        conflictModal: {
          columnKey,
          columnLabel: col?.label ?? columnKey,
          isOpen: true,
          side,
        },
      });
    }

    modalsStore.set({
      pinSideModal: { ...pinSideModal, isOpen: false },
    });
  };
};
