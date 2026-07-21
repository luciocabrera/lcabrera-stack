import type {
  ColumnOrderState,
  ColumnPinningState,
  TableColumnsState,
} from '@lcabrera/ui/components/Table/Table.types';

type GetPinningActionContextArgs<TData> = {
  readonly columnsStore: {
    readonly get: () => TableColumnsState<TData> | undefined;
  };
  readonly metaStore: {
    readonly get: () =>
      | undefined
      | {
          readonly drawersSyncNonce?: number;
          readonly persistenceKey?: string;
        };
  };
};

export const getPinningActionContext = <TData>({
  columnsStore,
  metaStore,
}: GetPinningActionContextArgs<TData>) => {
  const columnsState = columnsStore.get();
  const metaState = metaStore.get();

  return {
    columnOrder: columnsState?.columnOrder ?? ([] as ColumnOrderState<TData>),
    columnPinning:
      columnsState?.columnPinning ??
      ({ left: [], right: [] } as ColumnPinningState<TData>),
    columns: columnsState?.columns ?? [],
    columnSizing: columnsState?.columnSizing,
    columnVisibility: columnsState?.columnVisibility,
    drawersSyncNonce: metaState?.drawersSyncNonce ?? 0,
    persistenceKey: metaState?.persistenceKey ?? '',
    staticKeys: columnsState?.staticKeys,
  };
};
