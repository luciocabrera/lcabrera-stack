import type { UseStoreSelector } from '@/hooks';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  PaginationMeta,
  PaginationState,
  RowSelectionState,
  SortingState,
  TableMeta,
  TableState,
} from '../../Table.types';

import { useMetaStore, useTableStore } from './useTableStore.hook';

// ============================================================================
// Selector Hooks - Only re-render when specific state slice changes
// ============================================================================

/**
 * Select table data array
 */
export const useTableData = <TData>(): UseStoreSelector<
  TData[],
  TableState<TData>
> => useTableStore<TData[], TData>((state) => state.data);

/**
 * Select sorting state
 */
export const useSorting = <TData>(): UseStoreSelector<
  SortingState,
  TableState<TData>
> => useTableStore<SortingState, TData>((state) => state.sorting);

/**
 * Select column filters state
 */
export const useColumnFilters = <TData>(): UseStoreSelector<
  ColumnFiltersState,
  TableState<TData>
> => useTableStore<ColumnFiltersState, TData>((state) => state.columnFilters);


export const useColumns = <TData>(): UseStoreSelector<
  TableState<TData>['columns'],
  TableState<TData>
> => useTableStore<TableState<TData>['columns'], TData>((state) => state.columns);

/**
 * Select row selection state
 */
export const useRowSelection = <TData>(): UseStoreSelector<
  RowSelectionState,
  TableState<TData>
> => useTableStore<RowSelectionState, TData>((state) => state.rowSelection);

/**
 * Select column pinning state
 */
export const useColumnPinning = <TData>(): UseStoreSelector<
  ColumnPinningState,
  TableState<TData>
> => useTableStore<ColumnPinningState, TData>((state) => state.columnPinning);

/**
 * Select column sizing state
 */
export const useColumnSizing = <TData>(): UseStoreSelector<
  ColumnSizingState,
  TableState<TData>
> => useTableStore<ColumnSizingState, TData>((state) => state.columnSizing);

/**
 * Select pagination state
 */
export const usePagination = <TData>(): UseStoreSelector<
  PaginationState,
  TableState<TData>
> => useTableStore<PaginationState, TData>((state) => state.pagination);

/**
 * Select loading state
 */
export const useTableLoading = (): UseStoreSelector<boolean, TableMeta> =>
  useMetaStore((state) => state.isLoading);

/**
 * Select loading more state (infinite scroll)
 */
export const useTableLoadingMore = (): UseStoreSelector<boolean, TableMeta> =>
  useMetaStore((state) => state.isLoadingMore);

/**
 * Select total rows count
 */
export const useTotalRows = (): UseStoreSelector<number, TableMeta> =>
  useMetaStore((state) => state.totalRows);

/**
 * Select has more rows (infinite scroll)
 */
export const useHasMore = (): UseStoreSelector<boolean, TableMeta> =>
  useMetaStore((state) => state.hasMore);

/**
 * Select error state
 */
export const useTableError = (): UseStoreSelector<
  string | undefined,
  TableMeta
> => useMetaStore((state) => state.error);

/**
 * Select pagination metadata (for infinite scroll)
 */
export const usePaginationMeta = (): UseStoreSelector<
  PaginationMeta,
  TableMeta
> => useMetaStore((state) => state.paginationMeta);

/**
 * Select column order state
 */
export const useColumnOrder = <TData>(): UseStoreSelector<
  ColumnOrderState,
  TableState<TData>
> => useTableStore<ColumnOrderState, TData>((state) => state.columnOrder);

/**
 * Select column visibility state
 */
export const useColumnVisibility = <TData>(): UseStoreSelector<
  ColumnVisibilityState,
  TableState<TData>
> =>
  useTableStore<ColumnVisibilityState, TData>(
    (state) => state.columnVisibility,
  );


  export const useTablePersistenceKey = <TData>(): UseStoreSelector<
  string ,
  TableState<TData>
> => useTableStore((state) => state.persistenceKey);