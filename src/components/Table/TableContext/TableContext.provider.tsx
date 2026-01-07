import { useStore } from '@/hooks';

import type {
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  TableMeta,
  TableProviderProps,
  TableState,
} from './TableContext.types';

import { readPersistedStateFromCookie } from '../utils';
import { TableContext, type TableContextValue } from './TableContext.context';

type GetInitialTableStateArgs<TData> = {
  initialColumnOrder?: ColumnOrderState;
  initialColumnSizing?: ColumnSizingState;
  initialColumnVisibility?: ColumnVisibilityState;
  initialData?: TData[];
  initialPersistedState?: Partial<Omit<TableState<TData>, 'data'>>;
};

/**
 * Default initial table state
 */
const getInitialTableState = <TData,>({
  initialColumnOrder = [],
  initialColumnSizing = {},
  initialColumnVisibility = new Set<string>(),
  initialData = [],
  initialPersistedState = {},
}: GetInitialTableStateArgs<TData>): TableState<TData> => ({
  columnFilters: {},
  columnOrder: initialColumnOrder,
  columnPinning: { left: [], right: [] },
  columnSizing: initialColumnSizing,
  columnVisibility: initialColumnVisibility,
  data: initialData,
  pagination: { pageIndex: 0, pageSize: 50 },
  rowSelection: {},
  sorting: [],
  ...initialPersistedState,
});

type GetInitialMetaStateArgs = {
  initialData: unknown[];
  overrides?: Partial<TableMeta>;
};

/**
 * Default initial meta state
 */
const getInitialMetaState = ({
  initialData,
  overrides,
}: GetInitialMetaStateArgs): TableMeta => ({
  error: undefined,
  hasMore: false,
  isLoading: initialData.length === 0,
  isLoadingMore: false,
  paginationMeta: {},
  totalRows: initialData.length,
  ...overrides,
});

/**
 * Table context provider
 *
 * Provides table state and metadata stores to child components.
 * Uses external stores for granular subscriptions via useSyncExternalStore.
 *
 * @example
 * ```tsx
 * <TableProvider initialData={data} persistenceKey="car-sales-table">
 *   <Table columns={columns} />
 * </TableProvider>
 * ```
 */
export const TableProvider = <TData extends Record<string, unknown>>({
  children,
  initialColumnOrder,
  initialColumnSizing,
  initialColumnVisibility,
  initialData = [],
  initialMeta,
  initialSorting,
  persistenceKey,
}: TableProviderProps<TData>) => {
  // Read persisted state from cookies (SSR-safe)
  // Cookies are available during SSR, avoiding hydration mismatches
  const persistedState = persistenceKey
    ? readPersistedStateFromCookie({ persistenceKey })
    : {};

  // Loader-provided values take precedence over persisted state
  const effectiveColumnSizing =
    initialColumnSizing && Object.keys(initialColumnSizing).length > 0
      ? initialColumnSizing
      : (persistedState as Partial<TableState<TData>>).columnSizing;

  const effectiveColumnOrder =
    initialColumnOrder && initialColumnOrder.length > 0
      ? initialColumnOrder
      : (persistedState as Partial<TableState<TData>>).columnOrder;

  const effectiveColumnVisibility =
    initialColumnVisibility && initialColumnVisibility.size > 0
      ? initialColumnVisibility
      : (persistedState as Partial<TableState<TData>>).columnVisibility;

  const tableStore = useStore<TableState<TData>>(
    getInitialTableState({
      initialColumnOrder: effectiveColumnOrder,
      initialColumnSizing: effectiveColumnSizing,
      initialColumnVisibility: effectiveColumnVisibility,
      initialData,
      initialPersistedState: {
        ...(persistedState as Partial<TableState<TData>>),
        // Override with loader-provided values
        ...(initialSorting ? { sorting: initialSorting } : {}),
      },
    }),
  );

  const metaStore = useStore<TableMeta>(
    getInitialMetaState({ initialData, overrides: initialMeta }),
  );

  return (
    <TableContext
      value={{ metaStore, tableStore } as TableContextValue<unknown>}
    >
      {children}
    </TableContext>
  );
};
