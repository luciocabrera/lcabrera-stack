import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

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
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
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
      columnOrder: newColumnOrder,
      columnPinning: newPinning,
      columns,
      columnSizing,
      columnsStore,
      columnVisibility,
      drawersSyncNonce,
      metaStore,
      persistenceKey,
      persistTableState,
    });
  };
};
