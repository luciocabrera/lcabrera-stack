import { useCallback } from 'react';

import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  TableState,
} from '../TableContext.types';

import { useTableContextValue } from './useTableStore.hook';

// ============================================================================
// Action Hook Parameter Types
// ============================================================================

type AppendTableDataArgs = {
  hasMore: boolean;
  newData: unknown[];
  totalRows: number;
};

type SelectRowArgs = {
  isSelected: boolean;
  rowId: string;
};

type SetTableDataArgs = {
  data: unknown[];
  totalRows?: number;
};

// ============================================================================
// Action Hooks - Encapsulate common state updates
// ============================================================================

/**
 * Hook to update sorting state
 */
export const useSetSorting = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(
    (sorting: SortingState) => {
      tableStore.set({ sorting } as Partial<TableState<unknown>>);
    },
    [tableStore],
  );
};

/**
 * Hook to update column filters
 */
export const useSetColumnFilters = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(
    (columnFilters: ColumnFiltersState) => {
      tableStore.set({ columnFilters } as Partial<TableState<unknown>>);
    },
    [tableStore],
  );
};

/**
 * Hook to select/deselect a row
 */
export const useSelectRow = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(
    ({ isSelected, rowId }: SelectRowArgs) => {
      const current = tableStore.get()?.rowSelection ?? {};
      const rowSelection = { ...current, [rowId]: isSelected };
      tableStore.set({ rowSelection } as Partial<TableState<unknown>>);
    },
    [tableStore],
  );
};

/**
 * Hook to select/deselect all rows
 */
export const useSelectAllRows = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(
    (isSelected: boolean) => {
      const data = tableStore.get()?.data ?? [];
      const rowSelection = isSelected
        ? Object.fromEntries(data.map((_, index) => [String(index), true]))
        : {};
      tableStore.set({ rowSelection } as Partial<TableState<unknown>>);
    },
    [tableStore],
  );
};

/**
 * Hook to update pagination
 */
export const useSetPagination = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(
    (pagination: Partial<PaginationState>) => {
      const current = tableStore.get()?.pagination ?? {
        pageIndex: 0,
        pageSize: 50,
      };
      tableStore.set({
        pagination: { ...current, ...pagination },
      } as Partial<TableState<unknown>>);
    },
    [tableStore],
  );
};

/**
 * Hook to set table data
 */
export const useSetTableData = () => {
  const { metaStore, tableStore } = useTableContextValue();

  return useCallback(
    ({ data, totalRows }: SetTableDataArgs) => {
      tableStore.set({ data } as Partial<TableState<unknown>>);
      metaStore.set({
        isLoading: false,
        totalRows: totalRows ?? data.length,
      });
    },
    [tableStore, metaStore],
  );
};

/**
 * Hook to append data (for infinite scroll)
 */
export const useAppendTableData = () => {
  const { metaStore, tableStore } = useTableContextValue();

  return useCallback(
    ({ hasMore, newData, totalRows }: AppendTableDataArgs) => {
      const currentData = tableStore.get()?.data ?? [];
      tableStore.set({ data: [...currentData, ...newData] } as Partial<
        TableState<unknown>
      >);
      metaStore.set({
        hasMore,
        isLoadingMore: false,
        totalRows,
      });
    },
    [tableStore, metaStore],
  );
};

/**
 * Hook to set loading state
 */
export const useSetLoading = () => {
  const { metaStore } = useTableContextValue();

  return useCallback(
    (isLoading: boolean) => {
      metaStore.set({ isLoading });
    },
    [metaStore],
  );
};

/**
 * Hook to set loading more state
 */
export const useSetLoadingMore = () => {
  const { metaStore } = useTableContextValue();

  return useCallback(
    (isLoadingMore: boolean) => {
      metaStore.set({ isLoadingMore });
    },
    [metaStore],
  );
};

/**
 * Hook to set error state
 */
export const useSetError = () => {
  const { metaStore } = useTableContextValue();

  return useCallback(
    (error: string | undefined) => {
      metaStore.set({ error, isLoading: false, isLoadingMore: false });
    },
    [metaStore],
  );
};
