import { useStore } from '@/hooks';

import type {
  TableMeta,
  TableProviderProps,
  TableState,
} from './TableContext.types';

import { TableContext } from './TableContext.context';

/**
 * Default initial table state
 */
const getInitialTableState = <TData,>(
  initialData: TData[] = [],
): TableState<TData> => ({
  columnFilters: {},
  columnPinning: { left: [], right: [] },
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
}: TableProviderProps<TData>) => {
  const tableStore = useStore<TableState<TData>>(
    getInitialTableState(initialData),
  );

  const metaStore = useStore<TableMeta>(
    getInitialMetaState({ initialData, overrides: initialMeta }),
  );

  return (
    <TableContext value={{ metaStore, tableStore }}>{children}</TableContext>
  );
};
