import type { ColumnOrderState } from '@/components/Table/Table.types';
import type {
  PinSide,
  PinSidePreferenceOption,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';
import { useSetGlobalPinSidePreference } from '@/contexts/GlobalSettingsContext/actions';
import { useGetGlobalPinConflictResolutionPreference } from '@/contexts/GlobalSettingsContext/selectors';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  applyPin,
  buildAllOrderedColumns,
  getIsContiguousPin,
  resolveClosestEdgeSide,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useAcceptPinConflict } from './useAcceptPinConflict.hook';
import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

/**
 * Hook to handle accepting a pin side selection from the PinSideModal.
 */
export const useAcceptPinSide = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();
  const pinConflictResolutionPreference =
    useGetGlobalPinConflictResolutionPreference();
  const setGlobalPinSidePreference = useSetGlobalPinSidePreference();
  const acceptPinConflict = useAcceptPinConflict();

  return (pinSide: PinSidePreferenceOption) => {
    const pinSideModal = modalsStore.get()?.pinSideModal;
    if (!pinSideModal) return;

    const tableState = tableColumnsStore.get();
    const columns = tableState?.columns ?? [];
    const staticKeys = tableState?.staticKeys;
    const drawerState = drawerColumnsStore.get();
    const columnsOrder = drawerState?.columnOrder ?? ([] as ColumnOrderState);
    const columnPinning = drawerState?.columnPinning ?? { left: [], right: [] };

    let resolvedPinSide: PinSide = 'closest-edge';

    if (pinSide === 'always-ask') {
      setGlobalPinSidePreference(undefined);
    } else {
      resolvedPinSide = pinSide;
      setGlobalPinSidePreference(pinSide);
    }

    const { columnKey } = pinSideModal;
    const allOrderedColumns = buildAllOrderedColumns({
      columns,
      columnsOrder,
    });
    const side = resolveClosestEdgeSide({
      allOrderedColumns,
      columnKey,
      pinSide: resolvedPinSide,
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

      if (pinConflictResolutionPreference) {
        modalsStore.set({
          conflictModal: {
            columnKey,
            columnLabel: col?.label ?? columnKey,
            isOpen: false,
            side,
          },
        });
        acceptPinConflict(pinConflictResolutionPreference);
      } else {
        modalsStore.set({
          conflictModal: {
            columnKey,
            columnLabel: col?.label ?? columnKey,
            isOpen: true,
            side,
          },
        });
      }
    }

    modalsStore.set({
      pinSideModal: { ...pinSideModal, isOpen: false },
    });
  };
};
