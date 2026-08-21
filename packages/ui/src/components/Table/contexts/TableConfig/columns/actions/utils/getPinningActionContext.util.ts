import type {
  ColumnOrderState,
  ColumnPinningState,
  TableColumnsState,
} from '#ui/components/Table/Table.types';

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
    // Carried here so an action never re-reads the store for one more field:
    // a single snapshot per execution is a mandatory rule, and these fields
    // are only coherent read together.
    sorting: columnsState?.sorting,
    staticKeys: columnsState?.staticKeys,
  };
};
