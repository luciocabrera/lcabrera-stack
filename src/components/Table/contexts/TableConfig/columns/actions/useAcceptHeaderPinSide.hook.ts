import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
} from '@/components/Table/Table.types';
import type { PinConflictState, PinSide } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import {
  applyPin,
  buildAllOrderedColumns,
  getIsContiguousPin,
  resolveClosestEdgeSide,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';
import { getEffectiveColumns } from '@/components/Table/utils';

type AcceptHeaderPinSideArgs<TData> = {
  columnKey: DataKey<TData>;
  pinSide: PinSide;
};

export const useAcceptHeaderPinSide = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, pinSide }: AcceptHeaderPinSideArgs<TData>): PinConflictState | undefined => {
    const columnsState = columnsStore.get();
    const columns = columnsState?.columns ?? [];
    const columnsOrder = columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>);
    const columnPinning = columnsState?.columnPinning ?? { left: [], right: [] } as ColumnPinningState<TData>;
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';

    const allOrderedColumns = buildAllOrderedColumns({ columns, columnsOrder });

    const side = resolveClosestEdgeSide({
      allOrderedColumns,
      columnKey,
      pinSide,
    });

    const isContiguous = getIsContiguousPin({
      allOrderedColumns,
      columnKey,
      columnPinning: columnPinning as ColumnPinningState,
      side,
    });

    if (!isContiguous) {
      return { isOpen: true, side };
    }

    const newPinning = applyPin({
      columnKey,
      columnPinning: columnPinning as ColumnPinningState,
      side,
    });

    const effectiveColumns = getEffectiveColumns({
      columnOrder: columnsState?.columnOrder,
      columnPinning: newPinning,
      columns,
      columnVisibility: columnsState?.columnVisibility,
    });

    persistTableState({
      persistenceKey,
      slice: 'columnPinning',
      valueSlice: newPinning,
    });

    columnsStore.set({
      columnPinning: newPinning as ColumnPinningState<TData>,
      effectiveColumns,
    });
  };
};
