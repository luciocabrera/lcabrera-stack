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
export type ColumnFiltersState<TData = Record<string, unknown>> = Record<
  DataKey<TData>,
  ColumnFilter
>;

/**
 * Column order state - array of column keys in display order
 */
export type ColumnOrderState<TData = Record<string, unknown>> =
  DataKey<TData>[];
/**
 * Column pinning state
 */
export type ColumnPinningState<TData = Record<string, unknown>> = {
  /** Columns pinned to the left */
  left: DataKey<TData>[];
  /** Columns pinned to the right */
  right: DataKey<TData>[];
};

/**
 * Column sizing state - maps column key to custom width
 */
export type ColumnSizingState<TData = Record<string, unknown>> = Record<
  DataKey<TData>,
  number
>;

/**
 * Column visibility state - Set of visible column keys
 */
export type ColumnVisibilityState<TData = Record<string, unknown>> = Set<
  DataKey<TData>
>;

export type DataKey<TData> = (keyof TData & string) | string;

export type FilterData = {
  data: string[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  totalLoadedRows: number;
  totalRows: number;
};

/**
 * Response shape returned by fetchFilterOptions.
 * Contains paginated distinct values for a column's filter dropdown.
 */
export type FilterOptionsResponse = {
  hasMore: boolean;
  values: string[];
};

export type FiltersDataState<TData = Record<string, unknown>> = Record<
  DataKey<TData>,
  FilterData
>;

export type NormalizedColumnsState<TData = Record<string, unknown>> = Record<
  DataKey<TData>,
  TableColumn<TData> & {
    sortDirection?: 'asc' | 'desc';
    sortIndex?: number;
  }
>;

export type PinnedColumnInfo = {
  isFirstPinnedRight: boolean;
  isLastPinnedLeft: boolean;
  offset: number;
  side: 'left' | 'right';
};

/**
 * Sorting state for a single column
 */
export type SortingState<TData = Record<string, unknown>> = Sorting<TData>[];

/**
 * Storage type for persistence
 */
export type StorageType = 'cookie' | 'localStorage';

export type TableColumn<TData> = {
  dataType?: TableColumnDataType;
  /** Async function to fetch filter options from server (for facet filters with pagination) */
  fetchFilterOptions?: (params: {
    limit: number;
    skip: number;
  }) => Promise<FilterOptionsResponse>;
  /** Selector to extract options array from fetchFilterOptions response */
  filterOptionsDataSelector?: (response: FilterOptionsResponse) => string[];
  /** Selector to extract total count from fetchFilterOptions response */
  filterOptionsDataTotalSelector?: (response: FilterOptionsResponse) => number;
  /** Format options for the column based on data type */
  format?: TableColumnFormat;
  /** Whether this column can be filtered (default: true) */
  isFilterable?: boolean;
  /** Whether to hide the header content (label, controls, resize handle) */
  isHeaderHidden?: boolean;
  /** Whether this column can be resized by the user (default: true) */
  isResizable?: boolean;
  /** Whether this column is sortable (default: true) */
  isSortable?: boolean;
  /**
   * Whether this column is fully locked from user modifications.
   * When true, the column cannot be reordered, pinned/unpinned, resized, or hidden.
   * This is a read-only configuration — it cannot be changed at runtime.
   */
  isStatic?: boolean;
  key: 'actions' | (keyof TData & string);
  label: string;
  maxWidth?: number;
  minWidth?: number;
  /** Custom render function for body cells. Receives the row data. */
  render?: (row: TData) => ReactNode;
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
export type TableColumnsState<TData = Record<string, unknown>> = {
  /** Column filters state */
  columnFilters: ColumnFiltersState<TData>;
  /** Column order state */
  columnOrder: ColumnOrderState<TData>;
  /** Column pinning state */
  columnPinning: ColumnPinningState<TData>;
  columns: TableColumn<TData>[];
  /** Column sizing state (custom widths) */
  columnSizing: ColumnSizingState<TData>;
  /** Column visibility state */
  columnVisibility: ColumnVisibilityState<TData>;
  effectiveColumns: TableColumn<TData>[];
  normalizedColumns: NormalizedColumnsState<TData>;
  /** Sorting state */
  sorting: SortingState<TData>;
  /** Keys of columns marked as static (computed once from columns) */
  staticKeys: Set<string>;
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
  columnSelectedKey?: string;
  density: TableDensity;
  /** Error message if data fetch failed */
  error?: string;
  /** Initial page size for first load */
  initialPageSize: number;
  isBordered: boolean;
  isColumnSettingsOpen: boolean;
  isStriped: boolean;
  isTableSettingsOpen: boolean;
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
    isLoading?: boolean;
    response: TResponse;
  };

type BaseProps = ComponentPropsWithRef<'table'> & {
  actions?: ReactNode;
  customStylex?: StyleXStyles;
  icon?: ReactNode;
};
