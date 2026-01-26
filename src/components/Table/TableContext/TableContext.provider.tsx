import { useRef } from 'react';

import { useStore } from '@/hooks';
import { deepFreeze } from '@/utils';

import type {
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
  TableMeta,
  TableState,
} from '../Table.types';
import type { TableProviderProps } from './TableContext.types';

import { readPersistedStateFromCookie } from '../utils';
import { TableContext, type TableContextValue } from './TableContext.context';

type GetInitialTableStateArgs<TData> = {
  initialColumnOrder?: ColumnOrderState;
  initialColumns: TableColumn[];
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
  initialColumns,
  initialColumnSizing = {},
  initialColumnVisibility = new Set<string>(),
  initialData = [],
  initialPersistedState = {},
}: GetInitialTableStateArgs<TData>): TableState<TData> => ({
  columnFilters: {},
  columnOrder: initialColumnOrder,
  columnPinning: { left: [], right: [] },
  columns: initialColumns,
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
  initialColumnFilters,
  initialColumnOrder,
  initialColumns,
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

  // Trust initialSorting from loader - it's the source of truth
  // The loader reads sorting directly from the URL's sort= param
  // Don't read from window.location here - causes race conditions during navigation
  const effectiveSorting: SortingState | undefined = initialSorting;

  console.log('[TableProvider] Mount/Render:', {
    effectiveSorting,
    initialSorting,
    persistedStateSorting: (persistedState as Partial<TableState<TData>>).sorting,
    persistenceKey,
  });

  // Loader-provided values take precedence over persisted state
  const effectiveColumnSizing: ColumnSizingState | undefined =
    initialColumnSizing && Object.keys(initialColumnSizing).length > 0
      ? initialColumnSizing
      : (persistedState as Partial<TableState<TData>>).columnSizing;

  const effectiveColumnOrder: ColumnOrderState | undefined =
    initialColumnOrder && initialColumnOrder.length > 0
      ? initialColumnOrder
      : (persistedState as Partial<TableState<TData>>).columnOrder;

  const effectiveColumnVisibility: ColumnVisibilityState | undefined =
    initialColumnVisibility && initialColumnVisibility.size > 0
      ? initialColumnVisibility
      : (persistedState as Partial<TableState<TData>>).columnVisibility;

  // Deep freeze columnFilters in dev mode to detect accidental mutations
  const frozenColumnFilters = initialColumnFilters
    ? deepFreeze(initialColumnFilters)
    : undefined;

  // Ref to track when an imperative update is in progress
  // When true, effects should skip syncing to URL to avoid race conditions
  const isImperativeUpdateRef = useRef(false);

  const tableStore = useStore<TableState<TData>>(
    getInitialTableState({
      initialColumnOrder: effectiveColumnOrder,
      initialColumns,
      initialColumnSizing: effectiveColumnSizing,
      initialColumnVisibility: effectiveColumnVisibility,
      initialData,
      initialPersistedState: {
        ...(persistedState as Partial<TableState<TData>>),
        // Override with loader-provided values (use explicit check, not truthy)
        ...(frozenColumnFilters === undefined
          ? {}
          : { columnFilters: frozenColumnFilters }),
        // Use effectiveSorting which reads from current URL to handle race conditions
        // during navigation transitions when loader data might be stale
        ...(effectiveSorting === undefined ? {} : { sorting: effectiveSorting }),
      },
    }),
  );

  const metaStore = useStore<TableMeta>(
    getInitialMetaState({ initialData, overrides: initialMeta }),
  );

  return (
    <TableContext
      value={{ isImperativeUpdateRef, metaStore, tableStore } as TableContextValue<unknown>}
    >
      {children}
    </TableContext>
  );
};
