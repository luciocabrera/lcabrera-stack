import type { TableColumn } from '../Table.types';

export type TableSuspenseBoundaryProps<TData, TResponse = TData[]> = {
  /** Child render function receiving resolved data */
  children: (data: TData[]) => React.ReactNode;
  /** Column definitions for skeleton */
  columns: TableColumn[];
  /** Promise that resolves to table data or a response containing table data */
  dataPromise: Promise<TResponse>;
  /** Function to extract data array from the response. Defaults to identity (response is the data array). */
  dataSelector?: (response: TResponse) => TData[];
  /** Persistence key for restoring column widths in loading state */
  persistenceKey?: string;
};
