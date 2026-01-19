import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
  TableDensity,
} from '@/components/Table';

export type InfiniteScrollLoadMoreParams = {
  filters?: ColumnFiltersState;
  limit: number;
  skip: number;
  sorting?: SortingState;
};

export type InfiniteScrollLoadMoreResult<TData> = {
  data: TData[];
  hasMore: boolean;
  total: number;
};

export type TableLayoutInfiniteScrollConfig<TData> = {
  onLoadMore: (
    params: InfiniteScrollLoadMoreParams,
  ) => Promise<InfiniteScrollLoadMoreResult<TData>>;
};

export type TableLayoutProps<TData extends Record<string, unknown>> = {
  /** Column order from loader/URL state (optional) */
  columnOrder?: ColumnOrderState;
  /** Column definitions (required) */
  columns: TableColumn[];
  /** Column sizing from loader/URL state (optional) */
  columnSizing?: ColumnSizingState;
  /** Column visibility from loader/URL state (optional) */
  columnVisibility?: ColumnVisibilityState;
  /** Promise that resolves to the initial data (required) */
  dataPromise: Promise<unknown>;
  /** Function to extract data array from the promise response (required) */
  dataSelector: (response: unknown) => TData[];
  /** Table density (optional, default: 'comfortable') */
  density?: TableDensity;
  /** Active filters from loader/URL state (optional) */
  filters?: ColumnFiltersState;
  /** Infinite scroll configuration (required) */
  infiniteScrollConfig: TableLayoutInfiniteScrollConfig<TData>;
  /** Show table borders (optional, default: true) */
  isBordered?: boolean;
  /** Show striped rows (optional, default: true) */
  isStriped?: boolean;
  /** Key for persisting table state (required) */
  persistenceKey: string;
  /** Active sorting from loader/URL state (optional) */
  sorting?: SortingState;
  /** Table title (required) */
  title: string;
};
