import type { ReactNode } from 'react';

export type TableSuspenseBoundaryProps<TData, TResponse = TData[]> = {
  /** Child render function receiving resolved data */
  children: (response: TResponse) => React.ReactNode;
  /** Promise that resolves to table data or a response containing table data */
  dataPromise: Promise<TResponse>;
  /** Function to extract data array from the response. Defaults to identity (response is the data array). */
  dataSelector?: (response: TResponse) => TData[];
  icon?: ReactNode;
};
