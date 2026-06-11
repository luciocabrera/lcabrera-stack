import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  DataKey,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import {
  getEffectiveColumns,
  getPinnedColumnOffsets,
  splitColumnsByPinning,
  syncColumnOrderWithPinning,
} from '@/components/Table/utils';

type SetColumnPinningArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly side?: 'left' | 'right';
};

export const useSetColumnPinning = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, side }: SetColumnPinningArgs<TData>) => {
    const columnsState = columnsStore.get();
    const currentPinning = columnsState?.columnPinning ?? {
      left: [],
      right: [],
    };
    const columns = columnsState?.columns ?? [];
    const currentOrder =
      columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>);
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';

    const left = currentPinning.left.filter((k) => k !== columnKey);
    const right = currentPinning.right.filter((k) => k !== columnKey);

    let newPinning: ColumnPinningState<TData>;
    if (side === 'left') {
      newPinning = { left: [...left, columnKey], right };
    } else if (side === 'right') {
      newPinning = { left, right: [...right, columnKey] };
    } else {
      newPinning = { left, right };
    }

    const newColumnOrder = syncColumnOrderWithPinning<TData>({
      columnKey,
      columnPinning: side,
      columns,
      currentOrder,
      newPinning,
    });

    const effectiveColumns = getEffectiveColumns<TData>({
      columnOrder: newColumnOrder,
      columnPinning: newPinning,
      columns,
      columnVisibility: columnsState?.columnVisibility,
    });

    const columnGroups = splitColumnsByPinning<TData>({
      columnPinning: newPinning,
      effectiveColumns,
    });

    const columnSizing =
      columnsState?.columnSizing ?? ({} as ColumnSizingState<TData>);
    const pinnedColumnOffsets = getPinnedColumnOffsets<TData>({
      columnPinning: newPinning,
      columnSizing,
      effectiveColumns,
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
