import type { DataKey } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';

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
      columnSizing,
      columnVisibility,
      columns,
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
      columnSizing,
      columnVisibility,
      columns,
      columnsStore,
      persistenceKey,
      persistTableState,
    });
  };
};
