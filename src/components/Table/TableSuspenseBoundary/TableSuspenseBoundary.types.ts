import type { TableProps } from '../Table.types';

export type TableSuspenseBoundaryProps<
  TData extends Record<string, unknown>,
  TResponse = TData[],
> = Pick<TableProps<TData, TResponse>, 'dataSelector' | 'icon'> & {
  /** Child render function receiving resolved data */
  children: (response: TResponse) => React.ReactNode;
  /** Promise that resolves to table data or a response containing table data */
  dataPromise: Promise<TResponse>;
};
