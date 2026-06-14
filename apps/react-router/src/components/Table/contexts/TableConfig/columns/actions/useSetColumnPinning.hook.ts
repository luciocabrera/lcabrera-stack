import type { ColumnOrderState, DataKey } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import { getPinnedDerivedColumnsState } from '@/components/Table/utils';

import {
  commitPinningAndOrderUpdate,
  resolveColumnPinningUpdate,
} from './utils';

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
    const staticKeys = columnsState?.staticKeys;

    const { newColumnOrder, newPinning } = resolveColumnPinningUpdate<TData>({
      columnKey,
      columns,
      currentOrder,
      currentPinning,
      side,
      staticKeys,
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
