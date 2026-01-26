import { use, useEffect, useMemo, useRef, useState } from 'react';

import {
  useInfiniteScroll,
  useTablePersistence,
} from '@/components/Table/hooks';
import {
  INFINITE_SCROLL_THRESHOLD,
  INITIAL_PAGE_SIZE,
  LOAD_MORE_PAGE_SIZE,
  STRATEGY,
} from '@/components/Table/Table.constants';
import {
  TableContext,
  useColumnSizing,
  useSorting,
  useTableData,
  useTableLoadingMore,
} from '@/components/Table/TableContext';
import { compareValues } from '@/utils/compareValues.util';

import type { TableContentProps } from '../TableContent.types';

import { useColumns } from '../../TableContext/hooks/selectors.hooks';

type UseTableContentArgs<T extends Record<string, unknown>> = Pick<
  TableContentProps<T>,
  'data' | 'infiniteScrollConfig' | 'isClientSortingEnabled' | 'persistenceKey'
>;

export const useTableContent = <T extends Record<string, unknown>>({
  data,
  infiniteScrollConfig,
  isClientSortingEnabled = false,
  persistenceKey,
}: UseTableContentArgs<T>) => {
  const [columns] = useColumns<T>();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsPinned, setIsSettingsPinned] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const context = use(TableContext);
  const tableStore = context?.tableStore;

  const [columnSizing] = useColumnSizing<T>();
  const [storeData] = useTableData<T>();
  const [isLoadingMore] = useTableLoadingMore();
  const [sorting] = useSorting<T>();

  // Use data from store if available (for infinite scroll), otherwise use prop
  const effectiveData = storeData.length > 0 ? storeData : data;

  // Determine sorting mode: client, server, or none
  const sortingMode = isClientSortingEnabled ? 'client' : 'server';

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
    getState: () =>
      tableStore?.get() ?? {
        columnSizing: {},
      },
    persistenceKey: persistenceKey ?? 'default-table',
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
      persistSlice();
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [columnSizing, persistSlice, persistenceKey]);

  return {
    containerRef,
    dataToRender,
    isLoadingMore,
    isSettingsOpen,
    isSettingsPinned,
    setIsSettingsOpen,
    setIsSettingsPinned,
  };
};
