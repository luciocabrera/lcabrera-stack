import { useCallback } from 'react';

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  ColumnVisibilityState,
  PaginationMeta,
  PaginationState,
  SortingState,
  TableState,
} from '@/components/Table/Table.types';
import type { ColumnFilter } from '@/types/filterOperators.types';

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

type SetColumnFilterArgs = {
  columnKey: string;
  filter: ColumnFilter | null | undefined;
};

type SetColumnSizingArgs = {
  columnKey: string;
  width: number | undefined;
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
 * Hook to update a single column filter
 */
export const useSetColumnFilter = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(
    ({ columnKey, filter }: SetColumnFilterArgs) => {
      const current = tableStore.get()?.columnFilters ?? {};

      let columnFilters: ColumnFiltersState;
      if (filter === null || filter === undefined) {
        // Remove the filter by creating new object without it
        const { [columnKey]: unusedFilter, ...rest } = current;
        void unusedFilter; // Explicitly mark as intentionally unused
        columnFilters = rest;
      } else {
        columnFilters = { ...current, [columnKey]: filter };
      }

      tableStore.set({ columnFilters } as Partial<TableState<unknown>>);
    },
    [tableStore],
  );
};

/**
 * Hook to clear a single column filter
 */
export const useClearColumnFilter = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(
    (columnKey: string) => {
      const current = tableStore.get()?.columnFilters ?? {};
      const { [columnKey]: unusedFilter, ...rest } = current;
      void unusedFilter; // Explicitly mark as intentionally unused

      tableStore.set({ columnFilters: rest } as Partial<TableState<unknown>>);
    },
    [tableStore],
  );
};

/**
 * Hook to clear all column filters
 */
export const useClearAllColumnFilters = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(() => {
    tableStore.set({ columnFilters: {} } as Partial<TableState<unknown>>);
  }, [tableStore]);
};

/**
 * Hook to update column order
 */
export const useSetColumnOrder = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(
    (columnOrder: ColumnOrderState) => {
      tableStore.set({ columnOrder } as Partial<TableState<unknown>>);
    },
    [tableStore],
  );
};

/**
 * Hook to update column visibility
 */
export const useSetColumnVisibility = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(
    (columnVisibility: ColumnVisibilityState) => {
      tableStore.set({ columnVisibility } as Partial<TableState<unknown>>);
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

/**
 * Hook to set pagination metadata (for infinite scroll)
 */
export const useSetPaginationMeta = () => {
  const { metaStore } = useTableContextValue();

  return useCallback(
    (meta: Partial<PaginationMeta>) => {
      const current = metaStore.get()?.paginationMeta ?? {};
      metaStore.set({ paginationMeta: { ...current, ...meta } });
    },
    [metaStore],
  );
};

/**
 * Hook to update column sizing (resize)
 */
export const useSetColumnSizing = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(
    ({ columnKey, width }: SetColumnSizingArgs) => {
      const current = tableStore.get()?.columnSizing ?? {};

      let columnSizing: ColumnSizingState;
      if (width === undefined) {
        // Remove the key by creating new object without it
        const { [columnKey]: unusedColumn, ...rest } = current;
        void unusedColumn; // Explicitly mark as intentionally unused
        columnSizing = rest;
      } else {
        columnSizing = { ...current, [columnKey]: width };
      }

      tableStore.set({ columnSizing } as Partial<TableState<unknown>>);
    },
    [tableStore],
  );
};

/**
 * Hook to reset all column sizing
 */
export const useResetColumnSizing = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(() => {
    tableStore.set({ columnSizing: {} } as Partial<TableState<unknown>>);
  }, [tableStore]);
};

/**
 * Hook to set entire column sizing state at once (bulk update)
 */
export const useBulkSetColumnSizing = () => {
  const { tableStore } = useTableContextValue();

  return useCallback(
    (columnSizing: ColumnSizingState) => {
      tableStore.set({ columnSizing } as Partial<TableState<unknown>>);
    },
    [tableStore],
  );
};
