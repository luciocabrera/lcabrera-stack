import type { PinSide } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';
import { useGetGlobalPinConflictResolutionPreference } from '@/contexts/GlobalSettingsContext/selectors';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';
import { useAcceptPinConflict } from './useAcceptPinConflict.hook';
import { readPinActionState } from './utils/readPinActionState.util';
import { resolveAcceptedPinSideUpdate } from './utils/resolveAcceptedPinSideUpdate.util';

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

    const { columnPinning, columns, columnsOrder, staticKeys } =
      readPinActionState({
        drawerState: drawerColumnsStore.get(),
        tableState: tableColumnsStore.get(),
      });

    const { columnKey } = pinSideModal;
    const resolvedUpdate = resolveAcceptedPinSideUpdate({
      columnKey,
      columnPinning,
      columns,
      columnsOrder,
      pinConflictResolutionPreference,
      pinSide,
      staticKeys,
    });

    if (resolvedUpdate.kind === 'apply-resolved') {
      drawerColumnsStore.set({
        columnOrder: resolvedUpdate.columnOrder,
        columnPinning: resolvedUpdate.columnPinning,
      });
    } else {
      modalsStore.set({
        conflictModal: resolvedUpdate.conflictModal,
      });

      if (resolvedUpdate.kind === 'auto-accept-conflict') {
        acceptPinConflict(resolvedUpdate.resolution);
      }
    }

    modalsStore.set({
      pinSideModal: { ...pinSideModal, isOpen: false },
    });
  };
};
