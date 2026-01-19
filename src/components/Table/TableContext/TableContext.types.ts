/**
 * Table Context Types
 *
 * State management types for Table component with support for:
 * - Loading states (initial load, infinite scroll)
 * - Sorting, filtering, row selection
 * - Column pinning and pagination
 * - Infinite scroll metadata
 */

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableMeta,
  TablePersistenceConfig,
} from '../Table.types';

/**
 * Table provider props
 */
export type TableProviderProps<TData> = {
  /** Child components */
  children: React.ReactNode;
  /** Initial column filters state */
  initialColumnFilters?: ColumnFiltersState;
  /** Initial column order state */
  initialColumnOrder?: ColumnOrderState;
  /** Initial column sizing state */
  initialColumnSizing?: ColumnSizingState;
  /** Initial column visibility state */
  initialColumnVisibility?: ColumnVisibilityState;
  /** Initial data (can be empty array for loading state) */
  initialData?: TData[];
  /** Initial meta state overrides */
  initialMeta?: Partial<TableMeta>;
  /** Initial sorting state */
  initialSorting?: SortingState;
  /** Persistence configuration */
  persistenceConfig?: TablePersistenceConfig;
  /** Required key for persistence storage */
  persistenceKey?: string;
};
