import type {
  TableColumnsStateInput,
  TableGroupDrillFetcher,
  TableMetaState,
  TableProps,
} from '#ui/components/Table';

export type TableLayoutProps<
  TData extends Record<string, unknown>,
  TResponse,
> = Pick<
  TableProps<TData, TResponse>,
  | 'actions'
  | 'dataErrorSelector'
  | 'dataSelector'
  | 'dataTotalSelector'
  | 'onLoadMore'
> & {
  readonly columnsState: TableColumnsStateInput<TData>;
  readonly dataPromise: Promise<TResponse>;
  readonly metaState: Partial<TableMetaState>;
  /**
   * How a group fetches its own rows (ADR-079). Absent means no drill, whatever
   * `metaState.isGroupDrillEnabled` says — that flag is the route declaring its
   * endpoint exists, this is the call that reaches it.
   */
  readonly onDrillGroup?: TableGroupDrillFetcher;
};
