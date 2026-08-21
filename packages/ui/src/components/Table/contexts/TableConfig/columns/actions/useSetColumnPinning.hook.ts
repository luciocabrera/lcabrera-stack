import type { DataKey } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
import {
  commitResolvedPinningState,
  getPinningActionContext,
  resolveColumnPinningUpdate,
  toDeclaredColumnKey,
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
    const grouping = groupingStore.get();

    const { newColumnOrder, newPinning } = resolveColumnPinningUpdate<TData>({
      // A measure column pins the column it measures — see
      // `toDeclaredColumnKey`. Order and pinning are persisted layout state and
      // stay declared-only, or they accumulate keys that mean nothing without
      // the grouping that produced them.
      columnKey: toDeclaredColumnKey<TData>({ columnKey, columns }),
      columns,
      currentOrder: columnOrder,
      currentPinning: columnPinning,
      side,
      staticKeys,
    });

    commitResolvedPinningState<TData>({
      aggregates: grouping.aggregates,
      columnOrder: newColumnOrder,
      columnPinning: newPinning,
      columns,
      columnSizing,
      columnsStore,
      columnVisibility,
      drawersSyncNonce,
      groupingKeys: grouping.keys,
      metaStore,
      persistenceKey,
      persistTableState,
    });
  };
};
