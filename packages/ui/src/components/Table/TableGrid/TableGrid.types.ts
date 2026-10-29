import type { TableProps } from '../Table.types';

export type TableGridProps<
  TData extends Record<string, unknown>,
  TResponse,
> = Omit<TableProps<TData, TResponse>, 'response'> & {
  readonly response: readonly TData[] | TResponse;
};
