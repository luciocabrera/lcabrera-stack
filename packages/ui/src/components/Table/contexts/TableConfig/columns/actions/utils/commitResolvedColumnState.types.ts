import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  TableColumn,
  TableColumnAggregate,
  TableColumnsState,
  TableMetaState,
  TablePersistenceConfig,
  TablePersistenceSliceEntry,
} from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

export type CommitResolvedColumnStateArgs<
  TData,
  TSlice extends keyof TablePersistenceConfig,
> = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnsStore: Pick<TStore<TableColumnsState<TData>>, 'set'>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly drawersSyncNonce: number;
  readonly groupingKeys: readonly string[];
  readonly metaStore: Pick<TStore<TableMetaState>, 'set'>;
  readonly persistenceKey: string;
  readonly persistTableState: (
    entries: TablePersistenceSliceEntry<TSlice>[],
  ) => boolean;
};
