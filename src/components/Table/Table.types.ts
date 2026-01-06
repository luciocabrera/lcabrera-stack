import type { ComponentPropsWithRef, ReactNode } from 'react';

import type { CustomStylex } from '@/types/design-system.types';
import type {
  CurrencyFormatOptions,
  DateFormatOptions,
  NumberFormatOptions,
} from '@/utils/formatters';

import type { SortingState } from './TableContext';

export type { TableTitleProps } from './TableTitle';

/**
 * Column sizing state - maps column key to custom width
 */
export type ColumnSizingState = Record<string, number>;

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
 * Union of all pagination parameter types
 */
export type PaginationParams =
  | CursorParams
  | OffsetLimitParams
  | PageBasedParams;

/**
 * Pagination strategy for infinite scroll
 */
export type PaginationStrategy = 'cursor' | 'offset-limit' | 'page-based';

export type TableColumn = {
  dataType?: TableColumnDataType;
  /** Format options for the column based on data type */
  format?: TableColumnFormat;
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

export type TableProps<TData extends Record<string, unknown>> = BaseProps & {
  columns: TableColumn[];
  /** Column sizing state - custom widths for columns */
  columnSizing?: ColumnSizingState;
  data: TData[];
  /** Configuration for infinite scroll behavior */
  infiniteScrollConfig?: InfiniteScrollConfig<TData>;
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
  onFilterChange?: (filters: Record<string, unknown>) => Promise<void>;
  /** Callback when sorting changes (server-side sorting). If provided, sorting is server-controlled */
  onSortChange?: (args: OnSortChangeArgs) => Promise<void>;
  overscan?: number;
  /** Persistence key for storing table state (e.g., column widths) */
  persistenceKey?: string;
  rowHeight?: number;
};

type BaseProps = ComponentPropsWithRef<'table'> & {
  /** Optional actions to display in the table title header */
  actions?: ReactNode;
  customStylex?: CustomStylex;
  density?: TableDensity;
  icon?: ReactNode;
  isBordered?: boolean;
  isStriped?: boolean;
  title?: string;
};
