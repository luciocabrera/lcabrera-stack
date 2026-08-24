import type { TableProps } from '../Table.types';

export type TableSuspenseBoundaryProps<
  TData extends Record<string, unknown>,
  TResponse = TData[],
> = Pick<TableProps<TData, TResponse>, 'actions'> & {
  readonly children: (response: TResponse) => React.ReactNode;
  readonly dataPromise: Promise<TResponse>;
};
