import type { DataKey } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
import {
  commitResolvedVisibilityState,
  getPinningActionContext,
  resolveColumnVisibilityUpdate,
  toDeclaredColumnKey,
} from './utils';

type SetColumnVisibilityArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly isVisible: boolean;
};

export const useSetColumnVisibility = <TData>() => {
  const { columnsStore, groupingStore, metaStore } =
    useTableConfigContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return ({ columnKey, isVisible }: SetColumnVisibilityArgs<TData>) => {
    const {
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility: existingColumnVisibility,
      drawersSyncNonce,
      persistenceKey,
      staticKeys,
    } = getPinningActionContext<TData>({ columnsStore, metaStore });

    const declaredColumnKey = toDeclaredColumnKey<TData>({
      columnKey,
      columns,
    });

    if (staticKeys?.has(declaredColumnKey)) return;

    const grouping = groupingStore.get();

    const columnVisibility = resolveColumnVisibilityUpdate<TData>({
      columnKey: declaredColumnKey,
      columnVisibility: existingColumnVisibility,
      isVisible,
    });

    commitResolvedVisibilityState<TData>({
      aggregates: grouping.aggregates,
      columnOrder,
      columnPinning,
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
