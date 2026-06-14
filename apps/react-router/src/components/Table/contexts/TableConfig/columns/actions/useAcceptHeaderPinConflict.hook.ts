import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  DataKey,
} from '@/components/Table/Table.types';
import type { PinConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import {
  buildAllOrderedColumns,
  resolvePinConflictState,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import {
  getEffectiveColumns,
  getPinnedColumnOffsets,
  splitColumnsByPinning,
} from '@/components/Table/utils';

type AcceptHeaderPinConflictArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly resolution: PinConflictResolution;
  readonly side: 'left' | 'right';
};

export const useAcceptHeaderPinConflict = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return ({
    columnKey,
    resolution,
    side,
  }: AcceptHeaderPinConflictArgs<TData>) => {
    const columnsState = columnsStore.get();
    const columns = columnsState?.columns ?? [];
    const columnsOrder =
      columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>);
    const currentPinning =
      columnsState?.columnPinning ??
      ({ left: [], right: [] } as ColumnPinningState<TData>);
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';

    const staticKeys = columnsState?.staticKeys;
    const currentOrder =
      columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>);

    const allOrderedColumns = buildAllOrderedColumns({ columns, columnsOrder });
    const { columnOrder: newOrder, columnPinning: newPinning } =
      resolvePinConflictState<TData>({
        allOrderedColumns,
        columnKey,
        columns,
        currentOrder,
        currentPinning,
        resolution,
        side,
        staticKeys,
      });

    const effectiveColumns = getEffectiveColumns({
      columnOrder: newOrder,
      columnPinning: newPinning,
      columns,
      columnVisibility: columnsState?.columnVisibility,
    });

    const columnGroups = splitColumnsByPinning({
      columnPinning: newPinning,
      effectiveColumns,
    });

    const columnSizing =
      columnsState?.columnSizing ?? ({} as ColumnSizingState<TData>);
    const pinnedColumnOffsets = getPinnedColumnOffsets({
      columnPinning: newPinning,
      columnSizing,
      effectiveColumns,
    });

    const updates: Record<string, unknown> = {
      columnGroups,
      columnPinning: newPinning,
      effectiveColumns,
      pinnedColumnOffsets,
    };

    updates.columnOrder = newOrder;
    persistTableState([
      {
        persistenceKey,
        slice: 'columnPinning' as const,
        valueSlice: newPinning,
      },
      { persistenceKey, slice: 'columnOrder' as const, valueSlice: newOrder },
    ]);

    columnsStore.set(updates);
  };
};
