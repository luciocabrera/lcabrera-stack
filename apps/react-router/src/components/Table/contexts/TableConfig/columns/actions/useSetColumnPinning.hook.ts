import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import {
  getPinnedDerivedColumnsState,
  syncColumnOrderWithPinning,
} from '@/components/Table/utils';

import { commitPinningAndOrderUpdate } from './commitPinningAndOrderUpdate.util';

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

    const { columnGroups, effectiveColumns, pinnedColumnOffsets } =
      getPinnedDerivedColumnsState<TData>({
        columnOrder: newColumnOrder,
        columnPinning: newPinning,
        columnSizing: columnsState?.columnSizing,
        columns,
        columnVisibility: columnsState?.columnVisibility,
      });

    commitPinningAndOrderUpdate<TData>({
      columnGroups,
      columnsStore,
      effectiveColumns,
      newColumnOrder,
      newPinning,
      persistenceKey,
      persistTableState,
      pinnedColumnOffsets,
    });
  };
};
