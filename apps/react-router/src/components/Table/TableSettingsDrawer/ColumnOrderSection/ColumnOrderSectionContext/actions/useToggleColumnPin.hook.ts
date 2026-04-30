import type { ColumnOrderState } from '@/components/Table/Table.types';

import { useGetGlobalPinSidePreference } from '@/contexts/GlobalSettingsContext/selectors/useGetGlobalPinSidePreference.hook';
import { useGetGlobalUnpinConflictResolutionPreference } from '@/contexts/GlobalSettingsContext/selectors/useGetGlobalUnpinConflictResolutionPreference.hook';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  buildAllOrderedColumns,
  detectPinOrderConflict,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useAcceptPinSide } from './useAcceptPinSide.hook';
import { useAcceptUnpinConflict } from './useAcceptUnpinConflict.hook';
import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

type UseToggleColumnPinArgs = {
  readonly columnKey: string;
  readonly isPinning: boolean;
};
/**
 * Hook to toggle column pinning on/off.
 * Opens the appropriate modal when conflicts are detected.
 */
export const useToggleColumnPin = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();
  const globalPinSidePreference = useGetGlobalPinSidePreference();
  const globalUnpinConflictResolutionPreference =
    useGetGlobalUnpinConflictResolutionPreference();
  const acceptPinSide = useAcceptPinSide();
  const acceptUnpinConflict = useAcceptUnpinConflict();

  return ({ columnKey, isPinning }: UseToggleColumnPinArgs) => {
    const tableColumnsState = tableColumnsStore.get();
    const columns = tableColumnsState?.columns ?? [];
    const column = tableColumnsState?.normalizedColumns[columnKey];
    if (column?.isStatic) return;

    const staticKeys = tableColumnsState?.staticKeys ?? new Set<string>();

    const drawerState = drawerColumnsStore.get();
    const columnsOrder = drawerState?.columnOrder ?? ([] as ColumnOrderState);
    const columnPinning = drawerState?.columnPinning ?? { left: [], right: [] };

    const allOrderedColumns = buildAllOrderedColumns({
      columns,
      columnsOrder,
    });

    if (!isPinning) {
      const newPinning = {
        left: columnPinning.left.filter((k) => k !== columnKey),
        right: columnPinning.right.filter((k) => k !== columnKey),
      };

      const currentOrder = allOrderedColumns.map(
        (col) => col.key,
      ) as ColumnOrderState;

      if (
        !detectPinOrderConflict({
          columnPinning: newPinning,
          newOrder: currentOrder,
          staticKeys,
        })
      ) {
        drawerColumnsStore.set({ columnPinning: newPinning });
        return;
      }

      const side = columnPinning.left.includes(columnKey) ? 'left' : 'right';
      const col = allOrderedColumns.find((c) => c.key === columnKey);

      if (globalUnpinConflictResolutionPreference) {
        modalsStore.set({
          unpinConflictModal: {
            columnKey,
            columnLabel: col?.label ?? columnKey,
            isOpen: false,
            side,
          },
        });
        acceptUnpinConflict(globalUnpinConflictResolutionPreference);
      } else {
        modalsStore.set({
          unpinConflictModal: {
            columnKey,
            columnLabel: col?.label ?? columnKey,
            isOpen: true,
            side,
          },
        });
      }
      return;
    }

    const col = allOrderedColumns.find((c) => c.key === columnKey);

    if (globalPinSidePreference) {
      modalsStore.set({
        pinSideModal: {
          columnKey,
          columnLabel: col?.label ?? columnKey,
          isOpen: false,
        },
      });
      acceptPinSide(globalPinSidePreference);
      return;
    }

    modalsStore.set({
      pinSideModal: {
        columnKey,
        columnLabel: col?.label ?? columnKey,
        isOpen: true,
      },
    });
  };
};
