import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  TableColumn,
  TableColumnsState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';

/**
 * One `{ slice → value }` write handed to `persistTableState`, narrowed via
 * `TSlice` to the persisted slices a given commit path is allowed to touch.
 */
export type PersistTableStateEntry<TSlice extends string> = {
  readonly persistenceKey: string;
  readonly slice: TSlice;
  readonly valueSlice: unknown;
};

/**
 * Shared argument shape of the `commitResolved*State` utils: the resolved
 * column state to derive and commit, the columns/meta store setters, and the
 * persistence callback narrowed to that commit path's writable slices.
 * Variants re-require members they depend on (e.g. visibility re-requires
 * `columnVisibility`) via intersection.
 */
export type CommitResolvedColumnStateArgs<TData, TSlice extends string> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnsStore: {
    readonly set: (state: Partial<TableColumnsState<TData>>) => void;
  };
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly drawersSyncNonce: number;
  readonly metaStore: {
    readonly set: (state: Partial<TableMetaState>) => void;
  };
  readonly persistenceKey: string;
  readonly persistTableState: (
    entries: PersistTableStateEntry<TSlice>[],
  ) => boolean;
};
