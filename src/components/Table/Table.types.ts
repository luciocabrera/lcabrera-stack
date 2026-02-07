import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import type { ColumnFilter } from '@/types/filterOperators.types';
import type {
  CurrencyFormatOptions,
  DateFormatOptions,
  NumberFormatOptions,
} from '@/types/format.types';
import type { InfiniteScroll, Sorting } from '@/types/ui.types';

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
 * Sorting state for a single column
 */
export type SortingState = Sorting[];

/**
 * Storage type for persistence
 */
export type StorageType = 'cookie' | 'localStorage';

export type TableColumn<TData> = {
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
  key: (keyof TData & string) | string;
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

/**
 * Main table state stored in tableStore
 */
export type TableColumnsState<TData> = {
  /** Column filters state */
  columnFilters: ColumnFiltersState;
  /** Column order state */
  columnOrder: ColumnOrderState;
  /** Column pinning state */
  columnPinning: ColumnPinningState;
  columns: TableColumn<TData>[];
  /** Column sizing state (custom widths) */
  columnSizing: ColumnSizingState;
  /** Column visibility state */
  columnVisibility: ColumnVisibilityState;
  effectiveColumns: TableColumn<TData>[];
  normalizedColumns: NormalizedColumnsState<TData>;
  /** Sorting state */
  sorting: SortingState;
};

export type TableDataState<TData> = {
  /** Table data array */
  data: TData[]; /** Pagination state */
  /** Whether there are more rows to load (infinite scroll) */
  hasMore: boolean;
  /** Initial loading state */
  isLoading: boolean;
  /** Loading more rows (infinite scroll) */
  isLoadingMore: boolean;
  // pagination: PaginationState;
  totalLoadedRows: number;
  /** Total number of rows (for progress indication) */
  totalRows: number;
};

export type TableDensity = 'comfortable' | 'compact';

export type TableMetaState = {
  density: TableDensity;
  /** Error message if data fetch failed */
  error?: string;
  /** Initial page size for first load */
  initialPageSize: number;
  isBordered: boolean;
  isStriped: boolean;
  /** Page size for subsequent loads */
  loadMorePageSize: number;
  /** Locale for formatting (defaults to navigator.language) */
  locale?: string;
  overscan: number;
  persistenceKey: string;
  placeholderRowCount: number;
  rowHeight: number;
  threshold: number;
  title?: string;
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
  /** Persist sorting */
  sorting?: StorageType;
};

export type TableProps<
  TData extends Record<string, unknown>,
  TResponse,
> = BaseProps &
  InfiniteScroll<TData, TResponse> & {
    isFlexWrapperEnabled?: boolean;
    response: TResponse;
  };

type BaseProps = ComponentPropsWithRef<'table'> & {
  actions?: ReactNode;
  customStylex?: StyleXStyles;
  icon?: ReactNode;
};

type NormalizedColumnsState<TData> = Record<
  (keyof TData & string) | string,
  TableColumn<TData> & {
    sortDirection?: 'asc' | 'desc';
    sortIndex?: number;
  }
>;
