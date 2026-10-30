import type { ComponentPropsWithRef } from 'react';

import type { TableProps } from '../Table.types';

export type TableContentProps<
  TData extends Record<string, unknown>,
  TResponse,
> = Pick<
  TableProps<TData, TResponse>,
  | 'actions'
  | 'caption'
  | 'customStylex'
  | 'dataSelector'
  | 'dataTotalSelector'
  | 'footer'
  | 'icon'
  | 'onLoadMore'
> & {
  readonly tableProps?: ComponentPropsWithRef<'table'>;
};
