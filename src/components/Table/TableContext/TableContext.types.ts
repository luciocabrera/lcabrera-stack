/**
 * Table Context Types
 *
 * State management types for Table component with support for:
 * - Loading states (initial load, infinite scroll)
 * - Sorting, filtering, row selection
 * - Column pinning and pagination
 * - Infinite scroll metadata
 */

/**
 * Filter state for columns
 */
export type ColumnFiltersState = Record<string, unknown>;

/**
 * Column order state - array of column keys in display order
 */
export type ColumnOrderState = string[];

/**
 * Column pinning state
 */
export type ColumnPinningState = {
  /** Columns pinned to the left */
  left: string[];
  /** Columns pinned to the right */
  right: string[];
};

/**
 * Column sizing state - maps column key to custom width
 */
export type ColumnSizingState = Record<string, number>;

/**
 * Column visibility state - Set of visible column keys
 */
export type ColumnVisibilityState = Set<string>;

/**
 * Pagination metadata for infinite scroll strategies
 */
export type PaginationMeta = {
  /** Current cursor for cursor-based pagination */
  cursor?: string;
  /** Current offset for offset-limit pagination */
  offset?: number;
  /** Current page for page-based pagination */
  page?: number;
};

/**
 * Pagination state
 */
export type PaginationState = {
  /** Current page index (0-based) */
  pageIndex: number;
  /** Number of rows per page */
  pageSize: number;
};

/**
 * Row selection state (row id -> selected)
 */
export type RowSelectionState = Record<string, boolean>;

/**
 * Sort direction for a column
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sorting state for a single column
 */
export type SortingState = {
  /** Column key being sorted */
  columnKey: string;
  /** Sort direction */
  direction: SortDirection;
}[];

/**
 * Storage type for persistence
 */
export type StorageType = 'cookie' | 'localStorage';

/**
 * Table metadata stored in metaStore
 */
export type TableMeta = {
  /** Error message if data fetch failed */
  error: string | undefined;
  /** Whether there are more rows to load (infinite scroll) */
  hasMore: boolean;
  /** Initial loading state */
  isLoading: boolean;
  /** Loading more rows (infinite scroll) */
  isLoadingMore: boolean;
  /** Pagination metadata for tracking current position */
  paginationMeta: PaginationMeta;
  /** Total number of rows (for progress indication) */
  totalRows: number;
};

/**
 * Persistence configuration for table state slices
 */
export type TablePersistenceConfig = {
  /** Persist column filters */
  columnFilters?: StorageType;
  /** Persist column order */
  columnOrder?: StorageType;
  /** Persist column pinning */
  columnPinning?: StorageType;
  /** Persist column sizing (custom widths) */
  columnSizing?: StorageType;
  /** Persist column visibility */
  columnVisibility?: StorageType;
  /** Persist pagination */
  pagination?: StorageType;
  /** Persist sorting */
  sorting?: StorageType;
};

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

/**
 * Main table state stored in tableStore
 */
export type TableState<TData> = {
  /** Column filters state */
  columnFilters: ColumnFiltersState;
  /** Column order state */
  columnOrder: ColumnOrderState;
  /** Column pinning state */
  columnPinning: ColumnPinningState;
  /** Column sizing state (custom widths) */
  columnSizing: ColumnSizingState;
  /** Column visibility state */
  columnVisibility: ColumnVisibilityState;
  /** Table data array */
  data: TData[];
  /** Pagination state */
  pagination: PaginationState;
  /** Row selection state */
  rowSelection: RowSelectionState;
  /** Sorting state */
  sorting: SortingState;
};
