import { useStore } from '@/hooks';

import type { ColumnSizingState, TableMeta, TableProviderProps, TableState } from './TableContext.types';

import { getPersistedColumnSizing } from '../hooks/useTablePersistence';
import { TableContext } from './TableContext.context';

type GetInitialTableStateArgs<TData> = {
  initialColumnSizing?: ColumnSizingState;
  initialData?: TData[];
};

/**
 * Default initial table state
 */
const getInitialTableState = <TData,>({
  initialColumnSizing = {},
  initialData = [],
}: GetInitialTableStateArgs<TData>): TableState<TData> => ({
  columnFilters: {},
  columnPinning: { left: [], right: [] },
  columnSizing: initialColumnSizing,
  data: initialData,
  pagination: { pageIndex: 0, pageSize: 50 },
  rowSelection: {},
  sorting: [],
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
  // Read persisted column sizing synchronously during initialization
  // This avoids a flash of wrong column widths on first render
  const initialColumnSizing = persistenceKey
    ? getPersistedColumnSizing(persistenceKey)
    : {};

  const tableStore = useStore<TableState<TData>>(
    getInitialTableState({ initialColumnSizing, initialData }),
  );

  const metaStore = useStore<TableMeta>(
    getInitialMetaState({ initialData, overrides: initialMeta }),
  );

  return (
    <TableContext value={{ metaStore, tableStore }}>{children}</TableContext>
  );
};
