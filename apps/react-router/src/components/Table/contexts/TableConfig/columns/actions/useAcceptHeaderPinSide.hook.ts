import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
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
import {
  getEffectiveColumns,
  getPinnedColumnOffsets,
  splitColumnsByPinning,
  syncColumnOrderWithPinning,
} from '@/components/Table/utils';

type AcceptHeaderPinSideArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly pinSide: PinSide;
};
// TODO: Check all types casting here, I think they could be improved
export const useAcceptHeaderPinSide = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return ({
    columnKey,
    pinSide,
  }: AcceptHeaderPinSideArgs<TData>): PinConflictState | undefined => {
    const columnsState = columnsStore.get();
    const columns = columnsState?.columns ?? [];
    const columnsOrder =
      columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>);
    const columnPinning =
      columnsState?.columnPinning ??
      ({ left: [], right: [] } as ColumnPinningState<TData>);
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';

    const allOrderedColumns = buildAllOrderedColumns({ columns, columnsOrder });

    const side = resolveClosestEdgeSide({
      allOrderedColumns,
      columnKey,
      pinSide,
    });

    const isContiguous = getIsContiguousPin<TData>({
      allOrderedColumns,
      columnKey,
      columnPinning,
      side,
    });

    if (!isContiguous) {
      return { isOpen: true, side };
    }

    const staticKeys = columnsState?.staticKeys;
    const currentOrder =
      columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>);

    const newPinning = applyPin<TData>({
      columnKey,
      columnPinning,
      side,
      staticKeys,
    });

    const newColumnOrder = syncColumnOrderWithPinning<TData>({
      columnKey,
      columnPinning: side,
      columns,
      currentOrder,
      newPinning,
    });

    const effectiveColumns = getEffectiveColumns({
      columnOrder: newColumnOrder,
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

    persistTableState({
      persistenceKey,
      slice: 'columnPinning',
      valueSlice: newPinning,
    });
    persistTableState({
      persistenceKey,
      slice: 'columnOrder',
      valueSlice: newColumnOrder,
    });

    columnsStore.set({
      columnGroups,
      columnOrder: newColumnOrder,
      columnPinning: newPinning,
      effectiveColumns,
      pinnedColumnOffsets,
    });
  };
};
