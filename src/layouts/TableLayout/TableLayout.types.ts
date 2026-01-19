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
  total?: number;
};

export type TableLayoutInfiniteScrollConfig<TData> = {
  onLoadMore: (
    params: InfiniteScrollLoadMoreParams,
  ) => Promise<InfiniteScrollLoadMoreResult<TData>>;
};

export type TableLayoutProps<TData extends Record<string, unknown>> = {
  /** Column order from loader/URL state */
  columnOrder?: ColumnOrderState;
  /** Column definitions */
  columns: TableColumn[];
  /** Column sizing from loader/URL state */
  columnSizing?: ColumnSizingState;
  /** Column visibility from loader/URL state */
  columnVisibility?: ColumnVisibilityState;
  /** Promise that resolves to the initial data */
  dataPromise: Promise<unknown>;
  /** Function to extract data array from the promise response */
  dataSelector: (response: unknown) => TData[];
  /** Table density (default: 'comfortable') */
  density?: TableDensity;
  /** Active filters from loader/URL state */
  filters?: ColumnFiltersState;
  /** Infinite scroll configuration */
  infiniteScrollConfig: TableLayoutInfiniteScrollConfig<TData>;
  /** Show table borders (default: true) */
  isBordered?: boolean;
  /** Show striped rows (default: true) */
  isStriped?: boolean;
  /** Key for persisting table state */
  persistenceKey: string;
  /** Active sorting from loader/URL state */
  sorting?: SortingState;
  /** Table title */
  title: string;
};

export type TableLayoutInnerProps<TData extends Record<string, unknown>> = Omit<
  TableLayoutProps<TData>,
  'dataPromise' | 'dataSelector'
> & {
  initialData: TData[];
};
