import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import type { ColumnFilter } from '@/types/filterOperators.types';
import type {
  CurrencyFormatOptions,
  DateFormatOptions,
  NumberFormatOptions,
} from '@/utils/formatters';

export type { TableTitleProps } from './TableTitle';

/**
 * Column filters state - maps column key to filter configuration
 */
export type ColumnFiltersState = Record<string, ColumnFilter>;

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
 * Parameters for cursor-based pagination strategy
 */
export type CursorParams = {
  cursor: string;
  limit: number;
};

/**
 * Configuration for infinite scroll behavior
 */
export type InfiniteScrollConfig<TData> = {
  /** Initial page size for first load */
  initialPageSize: number;
  /** Whether infinite scroll is enabled */
  isEnabled: boolean;
  /** Page size for subsequent loads */
  loadMorePageSize: number;
  /** Callback to load more data with strategy-specific params */
  onLoadMore: (
    params: PaginationParams,
  ) => Promise<InfiniteScrollResponse<TData>>;
  /** Pagination strategy to use */
  strategy: PaginationStrategy;
  /** Distance from bottom (px) to trigger load. Defaults to DEFAULT_INFINITE_SCROLL_THRESHOLD */
  threshold?: number;
};

/**
 * Response from infinite scroll load more callback
 */
export type InfiniteScrollResponse<TData> = {
  data: TData[];
  hasMore: boolean;
  /** Next cursor for cursor-based pagination */
  nextCursor?: string;
  /** Total number of rows available */
  totalRows?: number;
};

/**
 * Parameters for offset-limit pagination strategy
 */
export type OffsetLimitParams = {
  limit: number;
  skip: number;
};

export type OnFilterChangeArgs = {
  filters: ColumnFiltersState;
};

export type OnSortChangeArgs = {
  sorting: { columnKey: string; direction: 'asc' | 'desc' }[];
};

/**
 * Parameters for page-based pagination strategy
 */
export type PageBasedParams = {
  page: number;
  pageSize: number;
};

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
 * Union of all pagination parameter types
 */
export type PaginationParams =
  | CursorParams
  | OffsetLimitParams
  | PageBasedParams;

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
 * Pagination strategy for infinite scroll
 */
export type PaginationStrategy = 'cursor' | 'offset-limit' | 'page-based';

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

export type TableColumn = {
  dataType?: TableColumnDataType;
  /** Async function to fetch filter options from server (for facet filters with pagination) */
  fetchFilterOptions?: (
    offset?: number,
  ) => Promise<{ hasMore: boolean; values: string[] }>;
  /** Static options for select/multiSelect filters */
  filterOptions?: string[];
  /** Format options for the column based on data type */
  format?: TableColumnFormat;
  /** Whether this column can be filtered (default: true) */
  isFilterable?: boolean;
  /** Whether this column is sortable (default: true) */
  isSortable?: boolean;
  key: string;
  label: string;
  maxWidth?: number;
  minWidth?: number;
};

export type TableColumnDataType =
  | 'boolean'
  | 'currency'
  | 'date'
  | 'number'
  | 'string';

/**
 * Format options for a column based on its data type
 */
export type TableColumnFormat = {
  /** Currency formatting options (for dataType: 'currency') */
  currency?: CurrencyFormatOptions;
  /** Date formatting options (for dataType: 'date') */
  date?: DateFormatOptions;
  /** Number formatting options (for dataType: 'number') */
  number?: NumberFormatOptions;
};

export type TableDensity = 'comfortable' | 'compact';

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

export type TableProps<TData extends Record<string, unknown>> = BaseProps & {
  columns: TableColumn[];
  /** Column sizing state - custom widths for columns */
  columnSizing?: ColumnSizingState;
  data: TData[];
  /** Configuration for infinite scroll behavior */
  infiniteScrollConfig?: InfiniteScrollConfig<TData>;
  /** Initial column filters (for SSR hydration) */
  initialColumnFilters?: ColumnFiltersState;
  /** Initial column order (for SSR hydration) */
  initialColumnOrder?: string[];
  /** Initial column visibility (for SSR hydration) */
  initialColumnVisibility?: Set<string>;
  /** Initial metadata for table state (hasMore, totalRows, paginationMeta) */
  initialMeta?: {
    hasMore?: boolean;
    paginationMeta?: Record<string, unknown>;
    totalRows?: number;
  };
  /** Initial sorting state */
  initialSorting?: SortingState;
  /** Enable client-side sorting when all data is available (default: false) */
  isClientSortingEnabled?: boolean;
  isFlexWrapperEnabled?: boolean;
  /** Show loading skeleton overlay */
  isLoading?: boolean;
  /** Locale for formatting (defaults to navigator.language) */
  locale?: string;
  /** Callback when filters change (server-side filtering) */
  onFilterChange?: (args: OnFilterChangeArgs) => Promise<void>;
  /** Callback when sorting changes (server-side sorting). If provided, sorting is server-controlled */
  onSortChange?: (args: OnSortChangeArgs) => Promise<void>;
  overscan?: number;
  /** Persistence key for storing table state (e.g., column widths) */
  persistenceKey?: string;
  rowHeight?: number;
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

type BaseProps = ComponentPropsWithRef<'table'> & {
  /** Optional actions to display in the table title header */
  actions?: ReactNode;
  customStylex?: StyleXStyles;
  density?: TableDensity;
  icon?: ReactNode;
  isBordered?: boolean;
  isStriped?: boolean;
  title?: string;
};
