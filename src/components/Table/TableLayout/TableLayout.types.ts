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
  columnOrder?: ColumnOrderState<TData>;
  /** Column pinning from loader/URL state (optional) */
  columnPinning?: ColumnPinningState<TData>;
  /** Column definitions (required) */
  columns: TableColumn<TData>[];
  /** Column sizing from loader/URL state (optional) */
  columnSizing?: ColumnSizingState<TData>;
  /** Column visibility from loader/URL state (optional) */
  columnVisibility?: ColumnVisibilityState<TData>;
  /** Promise that resolves to the initial data (required) */
  dataPromise: Promise<TResponse>;
  /** Function to extract data array from the promise response (required) */
  // dataSelector: (response: TResponse) => TData[];
  // dataTotalSelector?: (response: TResponse) => number;
  /** Default column pinning applied when no persisted state exists (optional) */
  defaultColumnPinning?: ColumnPinningState<TData>;
  /** Table density (optional, default: 'comfortable') */
  density?: TableDensity;
  /** Active filters from loader/URL state (optional) */
  filters?: ColumnFiltersState<TData>;
  /** Show table borders (optional, default: true) */
  isBordered?: boolean;
  /** Show striped rows (optional, default: true) */
  isStriped?: boolean;
  // onLoadMore: (params: InfiniteScrollLoadMoreParams) => Promise<TResponse>;
  /** Key for persisting table state (required) */
  persistenceKey: string;
  /** Active sorting from loader/URL state (optional) */
  sorting?: SortingState<TData>;
  /**
   * Key to reset only the Suspense boundary when data changes.
   * Unlike React's `key` prop on the whole component, this only remounts
   * the data-fetching boundary without destroying the table config store.
   */
  suspenseKey?: string;
  /** Table title (required) */
  title: string;
};
