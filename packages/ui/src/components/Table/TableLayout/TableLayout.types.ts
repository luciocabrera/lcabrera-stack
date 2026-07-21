import type {
  TableColumnsStateInput,
  TableMetaState,
  TableProps,
} from '@lcabrera/ui/components/Table';

export type TableLayoutProps<
  TData extends Record<string, unknown>,
  TResponse,
> = Pick<
  TableProps<TData, TResponse>,
  'actions' | 'dataSelector' | 'dataTotalSelector' | 'onLoadMore'
> & {
  readonly columnsState: TableColumnsStateInput<TData>;
  readonly dataPromise: Promise<TResponse>;
  readonly metaState: Partial<TableMetaState>;
};
