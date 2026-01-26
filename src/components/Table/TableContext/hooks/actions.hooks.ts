import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

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

import { writeStateSlice } from '../../utils';
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
  filter?: ColumnFilter | null;
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
  const [, setSearchParams] = useSearchParams();
  const tableState = tableStore.get();
  const persistenceKey = tableState?.persistenceKey ?? '';

  return useCallback(
    (columnFilters: ColumnFiltersState) => {
      // Persist to falling back storage mechanism (cookie/localStorage)
      writeStateSlice({
        persistenceKey,
        slice: 'columnFilters',
        storageType: 'cookie',
        value: columnFilters,
      });
      setSearchParams((params) => {
        if (Object.keys(columnFilters).length > 0) {
          params.set('filters', JSON.stringify(columnFilters));
        } else {
          params.delete('filters');
        }
        return params;
      });
      tableStore.set({ columnFilters });
    },
    [persistenceKey, setSearchParams, tableStore],
  );
};

/**
 * Hook to update a single column filter
 */
export const useSetColumnFilter = () => {
  const { tableStore } = useTableContextValue();
  const [, setSearchParams] = useSearchParams();

  const tableState = tableStore.get();
  const persistenceKey = tableState?.persistenceKey ?? '';

  return useCallback(
    ({ columnKey, filter }: SetColumnFilterArgs) => {
      let columnFilters: ColumnFiltersState;
      const current = tableState?.columnFilters ?? {};
      if (filter === null || filter === undefined) {
        // TODO: Improve later, i don't like this pattern
        // Remove the filter by creating new object without it
        const { [columnKey]: unusedFilter, ...rest } = current;
        void unusedFilter; // Explicitly mark as intentionally unused
        columnFilters = rest;
      } else {
        columnFilters = { ...current, [columnKey]: filter };
      }

      // Persist to falling back storage mechanism (cookie/localStorage)
      writeStateSlice({
        persistenceKey,
        slice: 'columnFilters',
        storageType: 'cookie',
        value: columnFilters,
      });

      // Update URL search params
      setSearchParams((params) => {
        if (Object.keys(columnFilters).length > 0) {
          params.set('filters', JSON.stringify(columnFilters));
        } else {
          params.delete('filters');
        }
        return params;
      });

      // Update table context state
      tableStore.set({ columnFilters });
    },
    [tableState?.columnFilters, persistenceKey, setSearchParams, tableStore],
  );
};

/**
 * Hook to clear a single column filter
 */
export const useClearColumnFilter = () => {
  const { tableStore } = useTableContextValue();
  const [, setSearchParams] = useSearchParams();

  const tableState = tableStore.get();
  const persistenceKey = tableState?.persistenceKey ?? '';

  return useCallback(
    (columnKey: string) => {
      const current = tableState?.columnFilters ?? {};
      const { [columnKey]: unusedFilter, ...rest } = current;
      void unusedFilter; // Explicitly mark as intentionally unused

      // Persist to falling back storage mechanism (cookie/localStorage)
      writeStateSlice({
        persistenceKey,
        slice: 'columnFilters',
        storageType: 'cookie',
        value: rest,
      });

      setSearchParams((params) => {
        if (Object.keys(rest).length > 0) {
          params.set('filters', JSON.stringify(rest));
        } else {
          params.delete('filters');
        }
        return params;
      });
      tableStore.set({ columnFilters: rest });
    },
    [persistenceKey, setSearchParams, tableState?.columnFilters, tableStore],
  );
};

/**
 * Hook to clear all column filters
 */
export const useClearAllColumnFilters = () => {
  const { tableStore } = useTableContextValue();
  const [, setSearchParams] = useSearchParams();
  const tableState = tableStore.get();
  const persistenceKey = tableState?.persistenceKey ?? '';

  return useCallback(() => {
    const current = tableState?.columnFilters ?? {};

    if (Object.keys(current).length === 0) {
      // No filters to clear
      return;
    }
    // Persist to falling back storage mechanism (cookie/localStorage)
    writeStateSlice({
      persistenceKey,
      slice: 'columnFilters',
      storageType: 'cookie',
      value: {},
    });
    setSearchParams((params) => {
      if (Object.keys(current).length > 0) {
        params.set('filters', JSON.stringify(current));
      } else {
        params.delete('filters');
      }
      return params;
    });
    tableStore.set({ columnFilters: {} });
  }, [persistenceKey, setSearchParams, tableState?.columnFilters, tableStore]);
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

export type BatchTableSettingsUpdate = {
  columnFilters: ColumnFiltersState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  columnVisibility: ColumnVisibilityState;
  sorting: SortingState;
};

/**
 * Hook to batch update all table settings at once
 * This prevents intermediate state updates that could trigger effects
 * between individual setter calls
 */
export const useBatchSetTableSettings = (): ((
  settings: BatchTableSettingsUpdate,
) => void) => {
  const { tableStore } = useTableContextValue();
  const [, setSearchParams] = useSearchParams();
  const tableState = tableStore.get();
  const persistenceKey = tableState?.persistenceKey ?? '';

  return useCallback(
    (settings: BatchTableSettingsUpdate) => {
      console.log('[batchSetTableSettings] Before:', {
        currentFilters: tableState?.columnFilters,
        currentSorting: tableState?.sorting,
      });
      console.log('[batchSetTableSettings] Setting:', {
        columnFilters: settings.columnFilters,
        sorting: settings.sorting,
      });

      // Persist to falling back storage mechanism (cookie/localStorage)

      const slices: (keyof BatchTableSettingsUpdate)[] = [
        'sorting',
        'columnFilters',
        'columnOrder',
        'columnSizing',
        'columnVisibility',
      ];

      for (const slice of slices) {
        writeStateSlice({
          persistenceKey,
          slice,
          storageType: 'cookie',
          value: settings[slice],
        });
      }
      // writeStateSlice({
      //   persistenceKey,
      //   slice: 'columnFilters',
      //   storageType: 'cookie',
      //   value: settings.columnFilters,
      // });
      // writeStateSlice({
      //   persistenceKey,
      //   slice: 'sorting',
      //   storageType: 'cookie',
      //   value: settings.sorting,
      // });
      // writeStateSlice({
      //   persistenceKey,
      //   slice: 'columnOrder',
      //   storageType: 'cookie',
      //   value: settings.columnOrder,
      // });
      // writeStateSlice({
      //   persistenceKey,
      //   slice: 'columnVisibility',
      //   storageType: 'cookie',
      //   value: settings.columnVisibility,
      // });
      // writeStateSlice({
      //   persistenceKey,
      //   slice: 'columnSizing',
      //   storageType: 'cookie',
      //   value: settings.columnSizing,
      // });

      setSearchParams((params) => {
        if (Object.keys(settings.columnFilters).length > 0) {
          params.set('filters', JSON.stringify(settings.columnFilters));
        } else {
          params.delete('filters');
        }
        if (Object.keys(settings.sorting).length > 0) {
          params.set('sort', JSON.stringify(settings.sorting));
        } else {
          params.delete('sort');
        }
        return params;
      });

      tableStore.set(settings);

      console.log('[batchSetTableSettings] After:', {
        newFilters: tableStore.get()?.columnFilters,
        newSorting: tableStore.get()?.sorting,
      });
    },
    [
      persistenceKey,
      setSearchParams,
      tableState?.columnFilters,
      tableState?.sorting,
      tableStore,
    ],
  );
};
