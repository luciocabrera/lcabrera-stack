import type { RefObject } from 'react';
import type { InfiniteScroll, PrefetchCache } from '@/types/ui.types';

import { DEFAULT_FILTER_PAGE_SIZE } from '@/components/Table/Table.constants';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { getErrorMessage } from '@/components/Table/utils/getErrorMessage.util';
import { getRequiredOnLoadMore } from '@/components/Table/utils/getRequiredOnLoadMore.util';
import type { DataKey } from '@/components/Table/Table.types';
import { logger } from '@/utils/logger';
import { clearPrefetchCache } from '@/utils/prefetch/clearPrefetchCache.util';
import { firePrefetch } from '@/utils/prefetch/firePrefetch.util';
import { resolveFromCacheOrFetch } from '@/utils/prefetch/resolveFromCacheOrFetch.util';

import { useFiltersDataContextValue } from '../../useFiltersDataContextValue.hook';

import { getTotalRows } from './getTotalRows.util';
import { shouldSkipInitialFetch } from './shouldSkipInitialFetch.util';
import type { FilterData } from '@/components/Table/Table.types';

type FetchFilterDataCallbackArgs<TResponse> = Omit<
  InfiniteScroll<string, TResponse>,
  'hasMore' | 'isLoadingMore'
>;

type UseFetchFilterDataArgs<TData, TResponse> = {
  readonly columnKey: DataKey<TData>;
  readonly prefetchRef?: RefObject<PrefetchCache<TResponse>>;
};

type UseFetchFilterDataReturn<TResponse> = {
  readonly fetchInitial: (
    args: FetchFilterDataCallbackArgs<TResponse>,
  ) => Promise<void>;
  readonly fetchMore: (
    args: FetchFilterDataCallbackArgs<TResponse>,
  ) => Promise<void>;
};

/**
 * Hook that provides both initial and paginated filter data fetching
 * for a column. When `prefetchRef` is provided, automatically prefetches
 * the next page after each successful load (if `enablePrefetch` is on).
 */
export const useFetchFilterData = <TData, TResponse>({
  columnKey,
  prefetchRef,
}: UseFetchFilterDataArgs<
  TData,
  TResponse
>): UseFetchFilterDataReturn<TResponse> => {
  const { filtersDataStore } = useFiltersDataContextValue();
  const { metaStore } = useTableConfigContextValue<TData>();

  const fetchInitial = async ({
    dataSelector,
    dataTotalSelector,
    onLoadMore,
  }: FetchFilterDataCallbackArgs<TResponse>) => {
    const filtersDataState = filtersDataStore.get();
    const currentFilter = filtersDataState?.[columnKey] as
      | FilterData
      | undefined;

    if (!currentFilter) {
      logger.error(
        '[useFetchFilterData] Filter data not initialized for column:',
        columnKey,
      );
      throw new Error(`Filter data not initialized for column: ${columnKey}`);
    }

    // Skip if already loaded or currently loading
    if (shouldSkipInitialFetch({ currentFilter })) {
      return;
    }

    const requiredOnLoadMore = getRequiredOnLoadMore(onLoadMore);

    try {
      filtersDataStore.set({
        [columnKey]: {
          ...currentFilter,
          isLoading: true,
        },
      });

      const response = await requiredOnLoadMore({
        limit: DEFAULT_FILTER_PAGE_SIZE,
        skip: 0,
      });

      const data = dataSelector ? dataSelector(response) : [];
      const totalRows = getTotalRows({ data, dataTotalSelector, response });
      const hasMore = totalRows > data.length;

      filtersDataStore.set({
        [columnKey]: {
          ...currentFilter,
          data,
          hasMore,
          isLoading: false,
          totalLoadedRows: data.length,
          totalRows,
        },
      });

      const metaState = metaStore.get();
      const enablePrefetch = metaState?.enablePrefetch ?? false;

      if (enablePrefetch && hasMore && prefetchRef) {
        firePrefetch({
          limit: DEFAULT_FILTER_PAGE_SIZE,
          nextSkip: data.length,
          onLoadMore: requiredOnLoadMore,
          prefetchRef,
        });
      }
    } catch (error) {
      logger.error('[useFetchFilterData] Error fetching filter data:', error);
      const message = getErrorMessage({
        error,
        fallback: 'Failed to load filter data',
      });
      metaStore.set({ error: message });

      filtersDataStore.set({
        [columnKey]: { ...currentFilter, isLoading: false },
      });
    }
  };

  const fetchMore = async ({
    dataSelector,
    dataTotalSelector,
    onLoadMore,
  }: FetchFilterDataCallbackArgs<TResponse>) => {
    const filtersDataState = filtersDataStore.get();
    const currentFilter = filtersDataState?.[columnKey] as
      | FilterData
      | undefined;
    const currentData = currentFilter?.data ?? [];

    const requiredOnLoadMore = getRequiredOnLoadMore(onLoadMore);

    if (!currentFilter) {
      throw new Error(`Filter data not initialized for column: ${columnKey}`);
    }

    try {
      filtersDataStore.set({
        [columnKey]: {
          ...currentFilter,
          isLoadingMore: true,
        },
      });

      const response = await resolveFromCacheOrFetch({
        cache: prefetchRef?.current,
        expectedSkip: currentData.length,
        fetchFn: () =>
          requiredOnLoadMore({
            limit: DEFAULT_FILTER_PAGE_SIZE,
            skip: currentData.length,
          }),
      });

      if (prefetchRef) {
        clearPrefetchCache({ prefetchRef });
      }

      const data = dataSelector ? dataSelector(response) : [];
      const combinedData = [...currentData, ...data];
      const totalLoadedRows = combinedData.length;
      const totalRows = dataTotalSelector
        ? dataTotalSelector(response)
        : currentFilter.totalRows || totalLoadedRows;
      const hasMore = totalRows > totalLoadedRows;

      filtersDataStore.set({
        [columnKey]: {
          ...currentFilter,
          data: combinedData,
          hasMore,
          isLoading: false,
          isLoadingMore: false,
          totalLoadedRows,
          totalRows,
        },
      });

      const metaState = metaStore.get();
      const enablePrefetch = metaState?.enablePrefetch ?? false;

      if (enablePrefetch && hasMore && prefetchRef) {
        firePrefetch({
          limit: DEFAULT_FILTER_PAGE_SIZE,
          nextSkip: totalLoadedRows,
          onLoadMore: requiredOnLoadMore,
          prefetchRef,
        });
      }
    } catch (error) {
      const message = getErrorMessage({
        error,
        fallback: 'Failed to load more data',
      });
      metaStore.set({ error: message });

      filtersDataStore.set({
        [columnKey]: { ...currentFilter, isLoadingMore: false },
      });
    }
  };

  return { fetchInitial, fetchMore };
};
