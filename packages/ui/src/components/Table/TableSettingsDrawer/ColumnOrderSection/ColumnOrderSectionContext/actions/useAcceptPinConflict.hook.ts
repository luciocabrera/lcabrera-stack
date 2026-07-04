import type { ColumnOrderState } from '@repo/ui/components/Table/Table.types';
import type { PinConflictResolution } from '@repo/ui/types/ui.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  buildAllOrderedColumns,
  resolvePinConflictState,
} from '@repo/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@repo/ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';
import { readPinActionState } from './utils/readPinActionState.util';

export const useAcceptPinConflict = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();

  return (resolution: PinConflictResolution) => {
    const conflictModal = modalsStore.get()?.conflictModal;
    if (!conflictModal) return;

    const { columnPinning, columns, columnsOrder, staticKeys } =
      readPinActionState({
        drawerState: drawerColumnsStore.get(),
        tableState: tableColumnsStore.get(),
      });

    const { columnKey, side } = conflictModal;
    const allOrderedColumns = buildAllOrderedColumns({
      columns,
      columnsOrder,
    });
    const nextState = resolvePinConflictState({
      allOrderedColumns,
      columnKey,
      columns,
      currentOrder: columnsOrder,
      currentPinning: columnPinning,
      resolution,
      side,
      staticKeys,
    });

    drawerColumnsStore.set({
      columnOrder: nextState.columnOrder as ColumnOrderState,
      columnPinning: nextState.columnPinning,
    });

    modalsStore.set({
      conflictModal: { ...conflictModal, isOpen: false },
    });
  };
};
