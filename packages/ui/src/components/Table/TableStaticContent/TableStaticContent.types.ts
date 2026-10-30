import type { TableContentProps } from '../TableContent/TableContent.types';

export type TableStaticContentProps<
  TData extends Record<string, unknown>,
  TResponse,
> = Omit<
  TableContentProps<TData, TResponse>,
  'dataSelector' | 'dataTotalSelector' | 'onLoadMore'
>;
