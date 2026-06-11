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
import {
  getPinnedDerivedColumnsState,
  syncColumnOrderWithPinning,
} from '@/components/Table/utils';

type AcceptHeaderPinSideArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly pinSide: PinSide;
};

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

    const { columnGroups, effectiveColumns, pinnedColumnOffsets } =
      getPinnedDerivedColumnsState<TData>({
        columnOrder: newColumnOrder,
        columnPinning: newPinning,
        columnSizing: columnsState?.columnSizing,
        columns,
        columnVisibility: columnsState?.columnVisibility,
      });

    persistTableState([
      {
        persistenceKey,
        slice: 'columnPinning',
        valueSlice: newPinning,
      },
      {
        persistenceKey,
        slice: 'columnOrder',
        valueSlice: newColumnOrder,
      },
    ]);

    columnsStore.set({
      columnGroups,
      columnOrder: newColumnOrder,
      columnPinning: newPinning,
      effectiveColumns,
      pinnedColumnOffsets,
    });
  };
};
