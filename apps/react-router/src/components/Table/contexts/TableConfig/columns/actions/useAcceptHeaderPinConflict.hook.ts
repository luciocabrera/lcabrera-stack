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
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import {
  getEffectiveColumns,
  getPinnedColumnOffsets,
  splitColumnsByPinning,
} from '@/components/Table/utils';

type PinSide = 'left' | 'right';

type PinAllBetweenArgs<TData> = {
  readonly allOrderedKeys: readonly DataKey<TData>[];
  readonly columnPinning: ColumnPinningState<TData>;
  readonly index: number;
  readonly side: PinSide;
};

const pinAllBetween = <TData>({
  allOrderedKeys,
  columnPinning,
  index,
  side,
}: PinAllBetweenArgs<TData>): ColumnPinningState<TData> => {
  const next = {
    left: [...columnPinning.left] as DataKey<TData>[],
    right: [...columnPinning.right] as DataKey<TData>[],
  };

  if (side === 'left') {
    for (const key of allOrderedKeys.slice(0, index + 1)) {
      if (!next.left.includes(key)) {
        next.right = next.right.filter((pinnedKey) => pinnedKey !== key);
        next.left.push(key);
      }
    }

    return next;
  }

  for (const key of allOrderedKeys.slice(index)) {
    if (!next.right.includes(key)) {
      next.left = next.left.filter((pinnedKey) => pinnedKey !== key);
      next.right.push(key);
    }
  }

  return next;
};

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

    const allOrderedColumns = buildAllOrderedColumns({ columns, columnsOrder });
    const index = allOrderedColumns.findIndex((col) => col.key === columnKey);
    const allOrderedKeys = allOrderedColumns.map(
      (column) => column.key,
    ) as DataKey<TData>[];

    let newPinning: ColumnPinningState<TData>;
    let newOrder: ColumnOrderState<TData> | undefined;

    if (resolution === 'move-column') {
      newOrder = allOrderedColumns
        .filter((col) => col.key !== columnKey)
        .map((col) => col.key) as ColumnOrderState<TData>;

      const column = allOrderedColumns[index];
      if (column?.key) {
        newOrder = insertAdjacentToPinnedGroup({
          columnKey: column.key,
          columnPinning: currentPinning as ColumnPinningState,
          order: newOrder,
          side,
        }) as ColumnOrderState<TData>;
      }

      newPinning = applyPin({
        columnKey,
        columnPinning: currentPinning as ColumnPinningState,
        side,
        staticKeys,
      }) as ColumnPinningState<TData>;
    } else if (resolution === 'pin-all-between') {
      newPinning = pinAllBetween({
        allOrderedKeys,
        columnPinning: currentPinning,
        index,
        side,
      });
    } else {
      newPinning = applyPin({
        columnKey,
        columnPinning: currentPinning as ColumnPinningState,
        side,
        staticKeys,
      }) as ColumnPinningState<TData>;
    }

    const effectiveColumns = getEffectiveColumns({
      columnOrder: newOrder ?? columnsState?.columnOrder,
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
