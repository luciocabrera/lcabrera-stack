import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
} from '@/components/Table/Table.types';
import type { UnpinConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  buildAllOrderedColumns,
  insertAdjacentToPinnedGroup,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { useTableDrawerContextValue } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

/**
 * Hook to handle accepting an unpin conflict resolution.
 */
export const useAcceptUnpinConflict = <
  TData extends Record<string, unknown> = Record<string, unknown>,
>() => {
  const { columnsStore: tableColumnsStore } =
    useTableConfigContextValue<TData>();
  const { columnsStore: drawerColumnsStore } =
    useTableDrawerContextValue<TData>();
  const { modalsStore } = useColumnOrderSectionContextValue();

  return (resolution: UnpinConflictResolution) => {
    const unpinConflictModal = modalsStore.get()?.unpinConflictModal;
    if (!unpinConflictModal) return;

    const columns = tableColumnsStore.get()?.columns ?? [];
    const drawerState = drawerColumnsStore.get();
    const columnsOrder =
      drawerState?.columnOrder ?? ([] as ColumnOrderState<TData>);
    const columnPinning =
      drawerState?.columnPinning ??
      ({ left: [], right: [] } as ColumnPinningState<TData>);

    const { columnKey, side } = unpinConflictModal;
    const conflictColumnKey = columnKey as DataKey<TData>;
    const allOrderedColumns = buildAllOrderedColumns({
      columns,
      columnsOrder,
    });
    const index = allOrderedColumns.findIndex(
      (col) => col.key === conflictColumnKey,
    );

    if (resolution === 'unpin-beyond') {
      let left = [...columnPinning.left];
      let right = [...columnPinning.right];

      if (side === 'left') {
        const keysToUnpin = new Set(
          allOrderedColumns
            .slice(index)
            .map((col) => col.key)
            .filter((key) => left.includes(key)),
        );
        left = left.filter((k) => !keysToUnpin.has(k));
      } else {
        const keysToUnpin = new Set(
          allOrderedColumns
            .slice(0, index + 1)
            .map((col) => col.key)
            .filter((key) => right.includes(key)),
        );
        right = right.filter((k) => !keysToUnpin.has(k));
      }

      const newPinning: ColumnPinningState<TData> = {
        left,
        right,
      };

      drawerColumnsStore.set({ columnPinning: newPinning });
    } else {
      // reorder-to-fill: remove pin and move remaining pinned columns together
      const newPinning: ColumnPinningState<TData> = {
        left: columnPinning.left.filter((k) => k !== conflictColumnKey),
        right: columnPinning.right.filter((k) => k !== conflictColumnKey),
      };

      const newOrder = allOrderedColumns
        .filter((col) => col.key !== conflictColumnKey)
        .map((col) => col.key) as readonly DataKey<TData>[];

      const reorderedOrder = insertAdjacentToPinnedGroup<TData>({
        columnKey: conflictColumnKey,
        columnPinning: newPinning,
        order: newOrder,
        side,
      });

      drawerColumnsStore.set({
        columnOrder: reorderedOrder,
        columnPinning: newPinning,
      });
    }

    modalsStore.set({
      unpinConflictModal: { ...unpinConflictModal, isOpen: false },
    });
  };
};
