import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { compareValues } from '@/utils/compareValues.util';

import type { TableContentProps } from '../TableContent.types';

import {
  useInfiniteScroll,
  useTablePersistence,
  useTableSearchParams,
} from '../../hooks';
import { DEFAULT_INFINITE_SCROLL_THRESHOLD } from '../../Table.constants';
import {
  TableContext,
  type TableState,
  useColumnOrder,
  useColumnSizing,
  useColumnVisibility,
  useSetColumnOrder,
  useSetColumnSizing,
  useSetColumnVisibility,
  useSetSorting,
  useSorting,
  useTableData,
  useTableLoadingMore,
} from '../../TableContext';

type UseTableContentArgs<T extends Record<string, unknown>> = Pick<
  TableContentProps<T>,
  | 'columns'
  | 'data'
  | 'infiniteScrollConfig'
  | 'isClientSortingEnabled'
  | 'onSortChange'
  | 'persistenceKey'
>;

type UseTableContentReturn<T extends Record<string, unknown>> = {
  columnOrder: string[];
  columnSizing: Record<string, number>;
  columnVisibility: Set<string>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  dataToRender: T[];
  isLoadingMore: boolean;
  isSettingsOpen: boolean;
  isSettingsPinned: boolean;
  setColumnOrder: (order: string[]) => void;
  setColumnSizing: (sizing: Record<string, number>) => void;
  setColumnVisibility: (visibility: Set<string>) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setIsSettingsPinned: (isPinned: boolean) => void;
  setSorting: (
    sorting: { columnKey: string; direction: 'asc' | 'desc' }[],
  ) => void;
  sorting: { columnKey: string; direction: 'asc' | 'desc' }[];
};

export const useTableContent = <T extends Record<string, unknown>>({
  columns,
  data,
  infiniteScrollConfig,
  isClientSortingEnabled = false,
  onSortChange,
  persistenceKey,
}: UseTableContentArgs<T>): UseTableContentReturn<T> => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsPinned, setIsSettingsPinned] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const context = use(TableContext);
  const tableStore = context?.tableStore;
  const [columnSizing] = useColumnSizing<T>();
  const [columnOrder] = useColumnOrder<T>();
  const [columnVisibility] = useColumnVisibility<T>();
  const [storeData] = useTableData<T>();
  const [isLoadingMore] = useTableLoadingMore();
  const [sorting] = useSorting<T>();
  const setColumnOrder = useSetColumnOrder();
  const setColumnSizing = useSetColumnSizing();
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
    columnOrder,
    columnVisibility,
    isEnabled: !!persistenceKey,
    persistenceKey: persistenceKey ?? 'default-table',
    sorting,
  });

  // Apply initial state from URL on mount (if available)
  useEffect(() => {
    if (!initialState) return;

    if (initialState.sorting) {
      setSorting(initialState.sorting);
    }
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
    initialPageSize: infiniteScrollConfig?.initialPageSize ?? 50,
    isEnabled: infiniteScrollConfig?.isEnabled ?? false,
    loadMorePageSize: infiniteScrollConfig?.loadMorePageSize ?? 50,
    onLoadMore:
      infiniteScrollConfig?.onLoadMore ??
      (() => Promise.resolve({ data: [], hasMore: false })),
    scrollContainerRef: containerRef,
    strategy: infiniteScrollConfig?.strategy ?? 'offset-limit',
    threshold:
      infiniteScrollConfig?.threshold ?? DEFAULT_INFINITE_SCROLL_THRESHOLD,
  });

  // Set up persistence if persistenceKey provided
  // Using cookies for column-specific settings so they're available during SSR
  const { persistSlice } = useTablePersistence({
    config: {
      columnFilters: persistenceKey ? 'localStorage' : undefined,
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

  return {
    columnOrder,
    columnSizing,
    columnVisibility,
    containerRef,
    dataToRender,
    isLoadingMore,
    isSettingsOpen,
    isSettingsPinned,
    setColumnOrder,
    setColumnSizing: setBulkColumnSizing,
    setColumnVisibility,
    setIsSettingsOpen,
    setIsSettingsPinned,
    setSorting,
    sorting,
  };
};
