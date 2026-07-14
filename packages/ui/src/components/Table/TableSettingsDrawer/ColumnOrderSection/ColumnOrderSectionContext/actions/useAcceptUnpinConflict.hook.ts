import type { DataKey } from '@repo/ui/components/Table/Table.types';
import type { UnpinConflictResolution } from '@repo/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDrawerContextValue } from '@repo/ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';
import { readPinActionState } from './utils/readPinActionState.util';
import { resolveAcceptedUnpinConflictState } from './utils/resolveAcceptedUnpinConflictState.util';

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

    const { columnPinning, columns, columnsOrder } = readPinActionState<TData>({
      drawerState: drawerColumnsStore.get(),
      tableState: tableColumnsStore.get(),
    });

    const { columnKey, side } = unpinConflictModal;
    const conflictColumnKey = columnKey as DataKey<TData>;

    const resolvedState = resolveAcceptedUnpinConflictState<TData>({
      columnKey: conflictColumnKey,
      columnPinning,
      columns,
      columnsOrder,
      resolution,
      side,
    });

    if (resolvedState.kind === 'update-pinning') {
      drawerColumnsStore.set({ columnPinning: resolvedState.columnPinning });
    } else {
      drawerColumnsStore.set({
        columnOrder: resolvedState.columnOrder,
        columnPinning: resolvedState.columnPinning,
      });
    }

    modalsStore.set({
      unpinConflictModal: { ...unpinConflictModal, isOpen: false },
    });
  };
};
