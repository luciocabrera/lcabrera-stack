import type { TableDataState, TableProps } from '../Table.types';

export type TableGridContentProps<
  TData extends Record<string, unknown>,
  TResponse,
> = Omit<TableGridProps<TData, TResponse>, 'response'> & {
  readonly dataState: Pick<
    TableDataState<TData>,
    'data' | 'error' | 'isLoading' | 'totalRows'
  >;
};

export type TableGridProps<
  TData extends Record<string, unknown>,
  TResponse,
> = Omit<TableProps<TData, TResponse>, 'response'> & {
  readonly response: readonly TData[] | TResponse;
};
