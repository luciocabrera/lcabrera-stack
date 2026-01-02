import type { ComponentPropsWithRef } from 'react';

import type { CustomStylex } from '@/types/design-system.types';
import type {
  CurrencyFormatOptions,
  DateFormatOptions,
  NumberFormatOptions,
} from '@/utils/formatters';

/**
 * Column sizing state - maps column key to custom width
 */
export type ColumnSizingState = Record<string, number>;

export type TableColumn = {
  dataType?: TableColumnDataType;
  /** Format options for the column based on data type */
  format?: TableColumnFormat;
  key: string;
  label: string;
  maxWidth?: number;
  minWidth?: number;
};

/**
 * Default minimum column width when not specified
 */
export const DEFAULT_MIN_COLUMN_WIDTH = 60;

/**
 * Default maximum column width when not specified
 */
export const DEFAULT_MAX_COLUMN_WIDTH = 600;

/**
 * Default threshold (in pixels) for triggering infinite scroll load
 */
export const DEFAULT_INFINITE_SCROLL_THRESHOLD = 200;

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
  data: TData[];
  /** Configuration for infinite scroll behavior */
  infiniteScrollConfig?: InfiniteScrollConfig<TData>;
  /** Initial metadata for table state (hasMore, totalRows, paginationMeta) */
  initialMeta?: { hasMore?: boolean; paginationMeta?: Record<string, unknown>; totalRows?: number };
  isFlexWrapperEnabled?: boolean;
  /** Show loading skeleton overlay */
  isLoading?: boolean;
  /** Locale for formatting (defaults to navigator.language) */
  locale?: string;
  /** Callback when filters change (server-side filtering) */
  onFilterChange?: (filters: Record<string, unknown>) => Promise<void>;
  /** Callback when sorting changes (server-side sorting) */
  onSortChange?: (sorting: { columnKey: string; direction: 'asc' | 'desc' }[]) => Promise<void>;
  overscan?: number;
  /** Persistence key for storing table state (e.g., column widths) */
  persistenceKey?: string;
  rowHeight?: number;
};

type BaseProps = ComponentPropsWithRef<'table'> & {
  customStylex?: CustomStylex;
  density?: TableDensity;
  isBordered?: boolean;
  isStriped?: boolean;
};
