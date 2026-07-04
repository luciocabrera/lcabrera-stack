import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  TableColumn,
  TableColumnsState,
} from '@repo/ui/components/Table/Table.types';

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

type GetPinningActionContextResult<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly drawersSyncNonce: number;
  readonly persistenceKey: string;
  readonly staticKeys?: Set<string>;
};

export const getPinningActionContext = <TData>({
  columnsStore,
  metaStore,
}: GetPinningActionContextArgs<TData>): GetPinningActionContextResult<TData> => {
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
