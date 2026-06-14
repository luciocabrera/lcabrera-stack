import type { ColumnOrderState } from '@/components/Table/Table.types';
import type { PinSide } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';
import { useGetGlobalPinConflictResolutionPreference } from '@/contexts/GlobalSettingsContext/selectors';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  buildAllOrderedColumns,
  derivePinSideResolutionState,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useAcceptPinConflict } from './useAcceptPinConflict.hook';
import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

export const useAcceptPinSide = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();
  const pinConflictResolutionPreference =
    useGetGlobalPinConflictResolutionPreference();
  const acceptPinConflict = useAcceptPinConflict();

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

    const resolution = derivePinSideResolutionState({
      allOrderedColumns,
      columnKey,
      columnPinning,
      columns,
      currentOrder: columnsOrder,
      pinSide,
      staticKeys,
    });

    if (resolution.kind === 'resolved') {
      drawerColumnsStore.set({
        columnOrder: resolution.columnOrder,
        columnPinning: resolution.columnPinning,
      });
    } else {
      const col = allOrderedColumns.find((c) => c.key === columnKey);

      if (pinConflictResolutionPreference) {
        modalsStore.set({
          conflictModal: {
            columnKey,
            columnLabel: col?.label ?? columnKey,
            isOpen: false,
            side: resolution.side,
          },
        });
        acceptPinConflict(pinConflictResolutionPreference);
      } else {
        modalsStore.set({
          conflictModal: {
            columnKey,
            columnLabel: col?.label ?? columnKey,
            isOpen: true,
            side: resolution.side,
          },
        });
      }
    }

    modalsStore.set({
      pinSideModal: { ...pinSideModal, isOpen: false },
    });
  };
};
