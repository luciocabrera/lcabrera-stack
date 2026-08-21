import type { DataKey } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
import {
  commitResolvedPinningState,
  getPinningActionContext,
  resolveColumnPinningUpdate,
} from './utils';

type SetColumnPinningArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly side?: 'left' | 'right';
};

export const useSetColumnPinning = <TData>() => {
  const { columnsStore, groupingStore, metaStore } =
    useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, side }: SetColumnPinningArgs<TData>) => {
    const {
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility,
      drawersSyncNonce,
      persistenceKey,
      staticKeys,
    } = getPinningActionContext<TData>({ columnsStore, metaStore });

    const { newColumnOrder, newPinning } = resolveColumnPinningUpdate<TData>({
      columnKey,
      columns,
      currentOrder: columnOrder,
      currentPinning: columnPinning,
      side,
      staticKeys,
    });

    commitResolvedPinningState<TData>({
      aggregates: groupingStore.get().aggregates,
      columnOrder: newColumnOrder,
      columnPinning: newPinning,
      columns,
      columnSizing,
      columnsStore,
      columnVisibility,
      drawersSyncNonce,
      groupingKeys: groupingStore.get().keys,
      metaStore,
      persistenceKey,
      persistTableState,
    });
  };
};
