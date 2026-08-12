import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  TableColumn,
  TableColumnsState,
  TableMetaState,
  TablePersistenceConfig,
  TablePersistenceSliceEntry,
} from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

/**
 * Shared argument shape of the `commitResolved*State` utils: the resolved
 * column state to derive and commit, the columns/meta store setters, and the
 * persistence callback narrowed to that commit path's writable slices.
 * Variants re-require members they depend on (e.g. visibility re-requires
 * `columnVisibility`) via intersection.
 */
export type CommitResolvedColumnStateArgs<
  TData,
  TSlice extends keyof TablePersistenceConfig,
> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnsStore: Pick<TStore<TableColumnsState<TData>>, 'set'>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly drawersSyncNonce: number;
  readonly metaStore: Pick<TStore<TableMetaState>, 'set'>;
  readonly persistenceKey: string;
  readonly persistTableState: (
    entries: TablePersistenceSliceEntry<TSlice>[],
  ) => boolean;
};
