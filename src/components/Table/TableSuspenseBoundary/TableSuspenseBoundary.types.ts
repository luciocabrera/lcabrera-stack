import type { TableColumn } from '../Table.types';

export type TableSuspenseBoundaryProps<TData> = {
  /** Child render function receiving resolved data */
  children: (data: TData[]) => React.ReactNode;
  /** Column definitions for skeleton */
  columns: TableColumn[];
  /** Promise that resolves to table data */
  dataPromise: Promise<TData[]>;
  /** Fallback skeleton row count */
  skeletonRowCount?: number;
};
