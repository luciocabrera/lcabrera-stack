import type {
  ColumnOrderState,
  ColumnPinningState,
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
import { getEffectiveColumns } from '@/components/Table/utils';

type AcceptHeaderPinConflictArgs<TData> = {
  columnKey: DataKey<TData>;
  resolution: PinConflictResolution;
  side: 'left' | 'right';
};

export const useAcceptHeaderPinConflict = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, resolution, side }: AcceptHeaderPinConflictArgs<TData>) => {
    const columnsState = columnsStore.get();
    const columns = columnsState?.columns ?? [];
    const columnsOrder = columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>);
    const currentPinning = columnsState?.columnPinning ?? { left: [], right: [] } as ColumnPinningState<TData>;
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';

    const allOrderedColumns = buildAllOrderedColumns({ columns, columnsOrder });
    const index = allOrderedColumns.findIndex((col) => col.key === columnKey);

    let newPinning: ColumnPinningState<TData>;
    let newOrder: ColumnOrderState<TData> | undefined;

    switch (resolution) {
      case 'move-column': {
        newOrder = allOrderedColumns
          .filter((col) => col.key !== columnKey)
          .map((col) => col.key) as ColumnOrderState<TData>;

        const column = allOrderedColumns[index];
        if (column?.key) {
          insertAdjacentToPinnedGroup({
            columnKey: column.key,
            columnPinning: currentPinning as ColumnPinningState,
            order: newOrder,
            side,
          });
        }

        newPinning = applyPin({
          columnKey,
          columnPinning: currentPinning as ColumnPinningState,
          side,
        }) as ColumnPinningState<TData>;
        break;
      }

      case 'pin-all-between': {
        newPinning = {
          left: [...currentPinning.left],
          right: [...currentPinning.right],
        };

        if (side === 'left') {
          for (let i = 0; i <= index; i++) {
            const colKey = allOrderedColumns[i]?.key ?? '';
            if (!newPinning.left.includes(colKey as DataKey<TData>)) {
              newPinning.right = newPinning.right.filter((k) => k !== colKey);
              newPinning.left.push(colKey as DataKey<TData>);
            }
          }
        } else {
          for (let i = index; i < allOrderedColumns.length; i++) {
            const colKey = allOrderedColumns[i]?.key ?? '';
            if (!newPinning.right.includes(colKey as DataKey<TData>)) {
              newPinning.left = newPinning.left.filter((k) => k !== colKey);
              newPinning.right.push(colKey as DataKey<TData>);
            }
          }
        }
        break;
      }

      case 'pin-only': {
        newPinning = applyPin({
          columnKey,
          columnPinning: currentPinning as ColumnPinningState,
          side,
        }) as ColumnPinningState<TData>;
        break;
      }
    }

    const effectiveColumns = getEffectiveColumns({
      columnOrder: newOrder ?? columnsState?.columnOrder,
      columnPinning: newPinning,
      columns,
      columnVisibility: columnsState?.columnVisibility,
    });

    const updates: Record<string, unknown> = {
      columnPinning: newPinning,
      effectiveColumns,
    };
    const persistUpdates = [
      { persistenceKey, slice: 'columnPinning', valueSlice: newPinning },
    ];

    if (newOrder) {
      updates.columnOrder = newOrder;
      persistUpdates.push({ persistenceKey, slice: 'columnOrder', valueSlice: newOrder });
    }

    persistTableState(persistUpdates);
    columnsStore.set(updates);
  };
};
