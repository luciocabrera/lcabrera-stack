import type {
  TableColumnsStateInput,
  TableGroupingState,
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
  readonly groupingState?: Partial<TableGroupingState>;
  readonly metaState: Partial<TableMetaState>;
};
