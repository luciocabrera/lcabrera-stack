import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { TableState } from '@/components/Table/Table.types';

import {
  useInfiniteScroll,
  useTablePersistence,
  useTableSearchParams,
} from '@/components/Table/hooks';
import {
  INFINITE_SCROLL_THRESHOLD,
  INITIAL_PAGE_SIZE,
  LOAD_MORE_PAGE_SIZE,
  STRATEGY,
} from '@/components/Table/Table.constants';
import {
  TableContext,
  useColumnFilters,
  useColumnOrder,
  useColumnSizing,
  useColumnVisibility,
  useSetColumnFilters,
  useSetColumnOrder,
  useSetColumnVisibility,
  useSetSorting,
  useSorting,
  useTableData,
  useTableLoadingMore,
} from '@/components/Table/TableContext';
import { compareValues } from '@/utils/compareValues.util';

import type { TableContentProps } from '../TableContent.types';

type UseTableContentArgs<T extends Record<string, unknown>> = Pick<
  TableContentProps<T>,
  | 'columns'
  | 'data'
  | 'infiniteScrollConfig'
  | 'initialColumnFilters'
  | 'isClientSortingEnabled'
  | 'onFilterChange'
  | 'onSortChange'
  | 'persistenceKey'
>;

export const useTableContent = <T extends Record<string, unknown>>({
  columns,
  data,
  infiniteScrollConfig,
  isClientSortingEnabled = false,
  onFilterChange,
  onSortChange,
  persistenceKey,
}: UseTableContentArgs<T>) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsPinned, setIsSettingsPinned] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const context = use(TableContext);
  const tableStore = context?.tableStore;
  const [columnFilters] = useColumnFilters<T>();
  const [columnSizing] = useColumnSizing<T>();
  const [columnOrder] = useColumnOrder<T>();
  const [columnVisibility] = useColumnVisibility<T>();
  const [storeData] = useTableData<T>();
  const [isLoadingMore] = useTableLoadingMore();
  const [sorting] = useSorting<T>();
  const setColumnFilters = useSetColumnFilters();
  const setColumnOrder = useSetColumnOrder();
  const setColumnVisibility = useSetColumnVisibility();
  const setSorting = useSetSorting();

  // Wrapper to set entire columnSizing state at once
  const setBulkColumnSizing = useCallback(
    (newColumnSizing: Record<string, number>) => {
      if (!tableStore) return;
      tableStore.set({
        columnSizing: newColumnSizing,
      } as Partial<TableState<T>>);
    },
    [tableStore],
  );

  // Sync table state with URL search params (higher priority than cookies)
  const { initialState } = useTableSearchParams({
    columnFilters,
    columnOrder,
    columnVisibility,
    isEnabled: !!persistenceKey,
    persistenceKey: persistenceKey ?? 'default-table',
    sorting,
  });

  // Apply initial state from URL on mount (if available)
  // Note: sorting and filters are now read directly by the loader from standalone params
  useEffect(() => {
    if (!initialState) return;

    if (initialState.columnOrder) {
      setColumnOrder(initialState.columnOrder);
    }
    if (initialState.columnVisibility) {
      setColumnVisibility(initialState.columnVisibility);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Use data from store if available (for infinite scroll), otherwise use prop
  const effectiveData = storeData.length > 0 ? storeData : data;

  // Determine sorting mode: client, server, or none
  const sortingMode = onSortChange
    ? 'server'
    : isClientSortingEnabled
      ? 'client'
      : 'none';

  // Server-side sorting: call onSortChange when sorting state changes
  useEffect(() => {
    if (sortingMode === 'server' && onSortChange && sorting.length > 0) {
      void onSortChange({
        sorting: sorting.map((sort) => ({
          columnKey: sort.columnKey,
          direction: sort.direction,
        })),
      });
    }
  }, [sorting, sortingMode, onSortChange]);

  // Server-side filtering: call onFilterChange when columnFilters state changes
  useEffect(() => {
    // Only call onFilterChange if filters have changed from the initial state
    // This avoids redundant calls when filters are loaded from URL/cookies
    // const initialFilters = initialFiltersRef.current ?? {};
    // const hasChanged =
    //   JSON.stringify(columnFilters) !== JSON.stringify(initialFilters);

    if (onFilterChange) {
      void onFilterChange({
        filters: columnFilters,
      });
    }
  }, [columnFilters, onFilterChange]);

  // Client-side sorting: apply sorting to data
  const sortedData = useMemo(() => {
    if (sortingMode !== 'client' || sorting.length === 0) {
      return effectiveData;
    }

    // eslint-disable-next-line local-rules/destructuring-for-functions
    return effectiveData.toSorted((a, b) => {
      // Sort by each column in order until we find a difference
      for (const sort of sorting) {
        const column = columns.find((col) => col.key === sort.columnKey);
        if (!column) continue;

        const aValue = a[sort.columnKey as keyof T];
        const bValue = b[sort.columnKey as keyof T];

        const comparison: number = compareValues({
          a: aValue,
          b: bValue,
          type: column.dataType ?? 'string',
        });

        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison;
        }
        // If equal, continue to next sort column
      }
      return 0; // All sort columns are equal
    });
  }, [sortingMode, sorting, effectiveData, columns]);

  // Use sorted data for rendering
  const dataToRender = sortingMode === 'client' ? sortedData : effectiveData;

  // Set up infinite scroll if configured
  useInfiniteScroll({
    initialPageSize: infiniteScrollConfig?.initialPageSize ?? INITIAL_PAGE_SIZE,
    isEnabled: infiniteScrollConfig?.isEnabled ?? false,
    loadMorePageSize:
      infiniteScrollConfig?.loadMorePageSize ?? LOAD_MORE_PAGE_SIZE,
    onLoadMore:
      infiniteScrollConfig?.onLoadMore ??
      (() => Promise.resolve({ data: [], hasMore: false })),
    scrollContainerRef: containerRef,
    strategy: infiniteScrollConfig?.strategy ?? STRATEGY,
    threshold: infiniteScrollConfig?.threshold ?? INFINITE_SCROLL_THRESHOLD,
  });

  // Set up persistence if persistenceKey provided
  // Using cookies for column-specific settings so they're available during SSR
  // Skip hydration since the loader already handles initial state from URL/cookies
  const { persistSlice } = useTablePersistence({
    config: {
      columnFilters: persistenceKey ? 'cookie' : undefined,
      columnOrder: persistenceKey ? 'cookie' : undefined,
      columnPinning: persistenceKey ? 'cookie' : undefined,
      columnSizing: persistenceKey ? 'cookie' : undefined,
      columnVisibility: persistenceKey ? 'cookie' : undefined,
      pagination: persistenceKey ? 'localStorage' : undefined,
      sorting: persistenceKey ? 'cookie' : undefined,
    },
    getState: () =>
      tableStore?.get() ?? {
        columnFilters: {},
        columnOrder: [],
        columnPinning: { left: [], right: [] },
        columnSizing: {},
        columnVisibility: new Set<string>(),
        pagination: { pageIndex: 0, pageSize: 50 },
        sorting: [],
      },
    persistenceKey: persistenceKey ?? 'default-table',
    restoreState: (state) => {
      tableStore?.set(state);
    },
    skipHydration: true, // Loader already handles initial state from URL/cookies
  });

  // Debounced persistence for column sizing (cookies only, not in URL)
  useEffect(() => {
    if (!persistenceKey) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      persistSlice('columnSizing');
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [columnSizing, persistSlice, persistenceKey]);

  // Persist to cookies as fallback (in case URL is cleared)
  useEffect(() => {
    if (!persistenceKey) return;
    persistSlice('columnOrder');
  }, [columnOrder, persistSlice, persistenceKey]);

  useEffect(() => {
    if (!persistenceKey) return;
    persistSlice('columnVisibility');
  }, [columnVisibility, persistSlice, persistenceKey]);

  useEffect(() => {
    if (!persistenceKey) return;
    persistSlice('sorting');
  }, [sorting, persistSlice, persistenceKey]);

  useEffect(() => {
    if (!persistenceKey) return;
    persistSlice('columnFilters');
  }, [columnFilters, persistSlice, persistenceKey]);

  return {
    columnFilters,
    columnOrder,
    columnSizing,
    columnVisibility,
    containerRef,
    dataToRender,
    isLoadingMore,
    isSettingsOpen,
    isSettingsPinned,
    setColumnFilters,
    setColumnOrder,
    setColumnSizing: setBulkColumnSizing,
    setColumnVisibility,
    setIsSettingsOpen,
    setIsSettingsPinned,
    setSorting,
    sorting,
  };
};
