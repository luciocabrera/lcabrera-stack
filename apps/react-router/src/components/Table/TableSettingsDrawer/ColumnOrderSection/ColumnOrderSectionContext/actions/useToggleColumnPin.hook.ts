import type { ColumnOrderState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  buildAllOrderedColumns,
  detectPinOrderConflict,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook.ts';

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
      modalsStore.set({
        unpinConflictModal: {
          columnKey,
          columnLabel: col?.label ?? columnKey,
          isOpen: true,
          side,
        },
      });
      return;
    }

    const col = allOrderedColumns.find((c) => c.key === columnKey);
    modalsStore.set({
      pinSideModal: {
        columnKey,
        columnLabel: col?.label ?? columnKey,
        isOpen: true,
      },
    });
  };
};
