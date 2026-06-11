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
  applyPin,
  buildAllOrderedColumns,
  insertAdjacentToPinnedGroup,
  pinAllBetween,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import {
  getEffectiveColumns,
  getPinnedColumnOffsets,
  splitColumnsByPinning,
  syncColumnOrderWithPinning,
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
    const index = allOrderedColumns.findIndex((col) => col.key === columnKey);
    const allOrderedKeys = allOrderedColumns.map((column) => column.key);

    let newPinning: ColumnPinningState<TData>;
    let newOrder: ColumnOrderState<TData> | undefined;

    if (resolution === 'move-column') {
      newOrder = allOrderedColumns
        .filter((col) => col.key !== columnKey)
        .map((col) => col.key);

      const column = allOrderedColumns[index];
      if (column?.key) {
        newOrder = insertAdjacentToPinnedGroup<TData>({
          columnKey: column.key,
          columnPinning: currentPinning,
          order: newOrder,
          side,
        });
      }

      newPinning = applyPin({
        columnKey,
        columnPinning: currentPinning,
        side,
        staticKeys,
      });
    } else if (resolution === 'pin-all-between') {
      newPinning = pinAllBetween<DataKey<TData>>({
        allOrderedKeys,
        columnPinning: currentPinning,
        index,
        side,
      });
    } else {
      newPinning = applyPin({
        columnKey,
        columnPinning: currentPinning,
        side,
        staticKeys,
      });
    }

    if (!newOrder) {
      newOrder = syncColumnOrderWithPinning<TData>({
        columnKey,
        columnPinning: side,
        columns,
        currentOrder,
        newPinning,
      });
    }

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

    if (newOrder) {
      updates.columnOrder = newOrder;
      persistTableState([
        {
          persistenceKey,
          slice: 'columnPinning' as const,
          valueSlice: newPinning,
        },
        { persistenceKey, slice: 'columnOrder' as const, valueSlice: newOrder },
      ]);
    } else {
      persistTableState({
        persistenceKey,
        slice: 'columnPinning' as const,
        valueSlice: newPinning,
      });
    }

    columnsStore.set(updates);
  };
};
