import type { ReactNode } from 'react';

import type { ColumnSizingState, TableColumn } from '../Table.types';

export type TableSuspenseBoundaryProps<TData, TResponse = TData[]> = {
  /** Child render function receiving resolved data */
  children: (data: TData[]) => React.ReactNode;
  /** Column definitions for skeleton */
  columns: TableColumn[];
  /** Column sizing state for skeleton */
  columnSizing?: ColumnSizingState;
  /** Promise that resolves to table data or a response containing table data */
  dataPromise: Promise<TResponse>;
  /** Function to extract data array from the response. Defaults to identity (response is the data array). */
  dataSelector?: (response: TResponse) => TData[];
  icon?: ReactNode;
  /** Initial column order (for SSR hydration and skeleton) */
  initialColumnOrder?: string[];
  /** Initial column visibility (for SSR hydration and skeleton) */
  initialColumnVisibility?: Set<string>;
  /** Persistence key for restoring column widths in loading state */
  persistenceKey?: string;
  title?: string;
};
