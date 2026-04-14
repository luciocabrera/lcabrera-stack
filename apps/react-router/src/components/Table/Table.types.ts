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
 * Pre-computed column groups split by pinning side, stored in columnsStore.
 */
export type ColumnGroupsState<TData = Record<string, unknown>> = {
  readonly centerCols: readonly TableColumn<TData>[];
  readonly leftPinnedCols: readonly TableColumn<TData>[];
  readonly rightPinnedCols: readonly TableColumn<TData>[];
};

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
  readonly left: DataKey<TData>[];
  /** Columns pinned to the right */
  readonly right: DataKey<TData>[];
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

export type DataKey<TData> = 'actions' | (keyof TData & string);

export type FilterData = {
  readonly data: string[];
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly totalLoadedRows: number;
  readonly totalRows: number;
};

/**
 * Response shape returned by fetchFilterOptions.
 * Contains paginated distinct values for a column's filter dropdown.
 */
export type FilterOptionsResponse = {
  readonly hasMore: boolean;
  readonly values: string[];
};

export type FiltersDataState<TData = Record<string, unknown>> = Record<
  DataKey<TData>,
  FilterData
>;

export type NormalizedColumnsState<TData = Record<string, unknown>> = Record<
  DataKey<TData>,
  TableColumn<TData> & {
    readonly sortDirection?: 'asc' | 'desc';
    readonly sortIndex?: number;
  }
>;

export type PinnedColumnInfo = {
  readonly isFirstPinnedRight: boolean;
  readonly isLastPinnedLeft: boolean;
  readonly offset: number;
  readonly side: 'left' | 'right';
};

/**
 * Pre-computed pinned column offset map stored in columnsStore.
 */
export type PinnedColumnOffsetsState<TData = Record<string, unknown>> = Partial<
  Record<DataKey<TData>, PinnedColumnInfo>
>;

/**
 * Sorting state for a single column
 */
export type SortingState<TData = Record<string, unknown>> = Sorting<TData>[];

/**
 * Storage type for persistence
 */
export type StorageType = 'cookie' | 'localStorage';

export type TableColumn<TData> = {
  readonly dataType?: TableColumnDataType;
  /** Async function to fetch filter options from server (for facet filters with pagination) */
  readonly fetchFilterOptions?: (params: {
    readonly limit: number;
    readonly skip: number;
  }) => Promise<FilterOptionsResponse>;
  /** Selector to extract options array from fetchFilterOptions response */
  readonly filterOptionsDataSelector?: (
    response: FilterOptionsResponse,
  ) => string[];
  /** Selector to extract total count from fetchFilterOptions response */
  readonly filterOptionsDataTotalSelector?: (
    response: FilterOptionsResponse,
  ) => number;
  /** Format options for the column based on data type */
  readonly format?: TableColumnFormat;
  /** Whether this column can be filtered (default: true) */
  readonly isFilterable?: boolean;
  /** Whether to hide the header content (label, controls, resize handle) */
  readonly isHeaderHidden?: boolean;
  /** Whether this column can be resized by the user (default: true) */
  readonly isResizable?: boolean;
  /** Whether this column is sortable (default: true) */
  readonly isSortable?: boolean;
  /**
   * Whether this column is fully locked from user modifications.
   * When true, the column cannot be reordered, pinned/unpinned, resized, or hidden.
   * This is a read-only configuration — it cannot be changed at runtime.
   */
  readonly isStatic?: boolean;
  readonly key: DataKey<TData>;
  readonly label: string;
  readonly maxWidth?: number;
  readonly minWidth?: number;
  /** Custom render function for body cells. Receives the row data. */
  readonly render?: (row: TData) => ReactNode;
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
  readonly currency?: CurrencyFormatOptions;
  /** Date formatting options (for dataType: 'date') */
  readonly date?: DateFormatOptions;
  /** Number formatting options (for dataType: 'number') */
  readonly number?: NumberFormatOptions;
};

/**
 * Main table state stored in tableStore
 */
export type TableColumnsState<TData = Record<string, unknown>> = {
  /** Column filters state */
  readonly columnFilters: ColumnFiltersState<TData>;
  /** Pre-computed column groups split by pinning side */
  readonly columnGroups: ColumnGroupsState<TData>;
  /** Column order state */
  readonly columnOrder: ColumnOrderState<TData>;
  /** Column pinning state */
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: TableColumn<TData>[];
  /** Column sizing state (custom widths) */
  readonly columnSizing: ColumnSizingState<TData>;
  /** Column visibility state */
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly effectiveColumns: TableColumn<TData>[];
  readonly normalizedColumns: NormalizedColumnsState<TData>;
  /** Pre-computed pinned column offset map */
  readonly pinnedColumnOffsets: PinnedColumnOffsetsState<TData>;
  /** Sorting state */
  readonly sorting: SortingState<TData>;
  /** Keys of columns marked as static (computed once from columns) */
  readonly staticKeys: Set<string>;
};

export type TableDataState<TData> = {
  /** Table data array */
  readonly data: TData[] /** Pagination state */;
  /** Whether there are more rows to load (infinite scroll) */
  readonly hasMore: boolean;
  /** Initial loading state */
  readonly isLoading: boolean;
  /** Loading more rows (infinite scroll) */
  readonly isLoadingMore: boolean;
  // pagination: PaginationState;
  readonly totalLoadedRows: number;
  /** Total number of rows (for progress indication) */
  readonly totalRows: number;
};

export type TableDensity = 'comfortable' | 'compact';

export type TableMetaState = {
  readonly columnOverscan: number;
  readonly columnSelectedKey?: string;
  readonly density: TableDensity;
  /** Whether to prefetch the next page after each load-more completes */
  readonly enablePrefetch: boolean;
  /** Error message if data fetch failed */
  readonly error?: string;
  /** Initial page size for first load */
  readonly initialPageSize: number;
  readonly isBordered: boolean;
  readonly isColumnSettingsOpen: boolean;
  readonly isStriped: boolean;
  readonly isTableSettingsOpen: boolean;
  /** Page size for subsequent loads */
  readonly loadMorePageSize: number;
  /** Locale for formatting (defaults to navigator.language) */
  readonly locale?: string;
  readonly overscan: number;
  readonly persistenceKey: string;
  readonly placeholderRowCount: number;
  readonly rowHeight: number;
  readonly threshold: number;
  readonly title?: string;
};

/**
 * Persistence configuration for table state slices
 */
export type TablePersistenceConfig = {
  /** Persist column filters */
  readonly columnFilters?: StorageType;
  /** Persist column order */
  readonly columnOrder?: StorageType;
  /** Persist column pinning */
  readonly columnPinning?: StorageType;
  /** Persist column sizing (custom widths) */
  readonly columnSizing?: StorageType;
  /** Persist column visibility */
  readonly columnVisibility?: StorageType;
  /** Persist sorting */
  readonly sorting?: StorageType;
};

export type TableProps<
  TData extends Record<string, unknown>,
  TResponse,
> = BaseProps &
  InfiniteScroll<TData, TResponse> & {
    readonly isFlexWrapperEnabled?: boolean;
    readonly isLoading?: boolean;
    readonly response: TResponse;
  };

type BaseProps = ComponentPropsWithRef<'table'> & {
  readonly actions?: ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly icon?: ReactNode;
};
