import type { TableProps } from '../Table.types';

export type TableContentProps<
  TData extends Record<string, unknown>,
  TResponse,
> = Pick<
  TableProps<TData, TResponse>,
  'actions' | 'dataSelector' | 'dataTotalSelector' | 'icon' | 'onLoadMore'
>;
