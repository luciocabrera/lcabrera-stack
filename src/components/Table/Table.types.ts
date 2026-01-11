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
 * Boolean column filter
 */
export type BooleanFilter = {
  type: 'boolean';
  value: boolean;
};

/**
 * Union type for all filter types based on column data type
 */
export type ColumnFilter =
  | BooleanFilter
  | DateFilter
  | NumberFilter
  | SelectFilter
  | TextFilter;

/**
 * Column filters state - maps column key to filter configuration
 */
export type ColumnFiltersState = Record<string, ColumnFilter>;

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
 * Date column filter
 */
export type DateFilter = {
  operator: 'after' | 'before' | 'between' | 'equals';
  type: 'date';
  /** ISO date string */
  value: string;
  /** Second date for 'between' operator (ISO string) */
  value2?: string;
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
 * Number/currency column filter
 */
export type NumberFilter = {
  operator:
    | 'between'
    | 'equals'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'notEquals';
  type: 'number';
  value: number;
  /** Second value for 'between' operator */
  value2?: number;
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

/**
 * Select/multi-select column filter
 */
export type SelectFilter = {
  type: 'multiSelect' | 'select';
  /** Single value for 'select' type */
  value?: string;
  /** Multiple values for 'multiSelect' type */
  values?: string[];
};

export type TableColumn = {
  dataType?: TableColumnDataType;
  /** Static options for select/multiSelect filters */
  filterOptions?: string[];
  /** Async function to fetch filter options from server (for facet filters with pagination) */
  fetchFilterOptions?: (offset?: number) => Promise<{ hasMore: boolean; values: string[] }>;
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
 * Text/string column filter
 */
export type TextFilter = {
  operator:
    | 'contains'
    | 'endsWith'
    | 'equals'
    | 'notContains'
    | 'notEquals'
    | 'startsWith';
  type: 'text';
  value: string;
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
