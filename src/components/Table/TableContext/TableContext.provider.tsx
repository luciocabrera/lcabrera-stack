import { useStore } from '@/hooks';

import type { ColumnSizingState, TableMeta, TableProviderProps, TableState } from './TableContext.types';

import { readPersistedStateFromCookie } from '../hooks/tablePersistence.helper';
import { TableContext, type TableContextValue } from './TableContext.context';

type GetInitialTableStateArgs<TData> = {
  initialColumnSizing?: ColumnSizingState;
  initialData?: TData[];
  initialPersistedState?: Partial<Omit<TableState<TData>, 'data'>>;
};

/**
 * Default initial table state
 */
const getInitialTableState = <TData,>({
  initialColumnSizing = {},
  initialData = [],
  initialPersistedState = {},
}: GetInitialTableStateArgs<TData>): TableState<TData> => ({
  columnFilters: {},
  columnPinning: { left: [], right: [] },
  columnSizing: initialColumnSizing,
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
  initialData = [],
  initialMeta,
  persistenceKey,
}: TableProviderProps<TData>) => {
  // Read persisted state from cookies (SSR-safe)
  // Cookies are available during SSR, avoiding hydration mismatches
  const persistedState = persistenceKey
    ? readPersistedStateFromCookie({ persistenceKey })
    : {};

  const tableStore = useStore<TableState<TData>>(
    getInitialTableState({ 
      initialData, 
      initialPersistedState: persistedState as Partial<TableState<TData>>,
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
