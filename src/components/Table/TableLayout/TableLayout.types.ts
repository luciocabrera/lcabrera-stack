import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
  TableDensity,
  TableProps,
} from '@/components/Table';

export type TableLayoutProps<
  TData extends Record<string, unknown>,
  TResponse,
> = Pick<
  TableProps<TData, TResponse>,
  'dataSelector' | 'dataTotalSelector' | 'onLoadMore'
> & {
  /** Column order from loader/URL state (optional) */
  readonly columnOrder?: ColumnOrderState<TData>;
  /** Column pinning from loader/URL state (optional) */
  readonly columnPinning?: ColumnPinningState<TData>;
  /** Column definitions (required) */
  readonly columns: TableColumn<TData>[];
  /** Column sizing from loader/URL state (optional) */
  readonly columnSizing?: ColumnSizingState<TData>;
  /** Column visibility from loader/URL state (optional) */
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  /** Promise that resolves to the initial data (required) */
  readonly dataPromise: Promise<TResponse>;
  /** Function to extract data array from the promise response (required) */
  // dataSelector: (response: TResponse) => TData[];
  // dataTotalSelector?: (response: TResponse) => number;
  /** Default column pinning applied when no persisted state exists (optional) */
  readonly defaultColumnPinning?: ColumnPinningState<TData>;
  /** Table density (optional, default: 'comfortable') */
  readonly density?: TableDensity;
  /** Prefetch next page after each load-more completes (optional, default: false) */
  readonly enablePrefetch?: boolean;
  /** Active filters from loader/URL state (optional) */
  readonly filters?: ColumnFiltersState<TData>;
  /** Show table borders (optional, default: true) */
  readonly isBordered?: boolean;
  /** Show striped rows (optional, default: true) */
  readonly isStriped?: boolean;
  /** Page size for load-more requests (optional, default: LOAD_MORE_PAGE_SIZE) */
  readonly loadMorePageSize?: number;
  // onLoadMore: (params: InfiniteScrollLoadMoreParams) => Promise<TResponse>;
  /** Key for persisting table state (required) */
  readonly persistenceKey: string;
  /** Active sorting from loader/URL state (optional) */
  readonly sorting?: SortingState<TData>;
  /**
   * Key to reset only the Suspense boundary when data changes.
   * Unlike React's `key` prop on the whole component, this only remounts
   * the data-fetching boundary without destroying the table config store.
   */
  readonly suspenseKey?: string;
  /** Table title (required) */
  readonly title: string;
};
