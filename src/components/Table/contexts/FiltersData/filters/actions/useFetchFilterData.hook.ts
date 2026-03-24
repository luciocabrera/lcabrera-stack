import type { RefObject } from 'react';
import type { InfiniteScroll, PrefetchCache } from '@/types/ui.types';

import { DEFAULT_FILTER_PAGE_SIZE } from '@/components/Table/Table.constants';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { logger } from '@/utils/logger';

import { useFiltersDataContextValue } from '../../useFiltersDataContextValue.hook';
import { prefetchNextPage as prefetchNextPageUtil } from './prefetchNextPage.util';
import type { DataKey } from '@/components/Table/Table.types';

type FetchFilterDataArgs<TResponse> = Omit<
  InfiniteScroll<string, TResponse>,
  'hasMore' | 'isLoadingMore'
>;

type UseFetchFilterDataArgs<TData, TResponse> = {
  readonly columnKey: DataKey<TData>;
  readonly prefetchRef?: RefObject<PrefetchCache<TResponse>>;
};

/**
 * Hook to fetch initial filter data for a column.
 * When `prefetchRef` is provided, automatically prefetches the next page
 * after a successful initial load (if `enablePrefetch` is on).
 */
export const useFetchFilterData = <TData, TResponse>({
  columnKey,
  prefetchRef,
}: UseFetchFilterDataArgs<TData, TResponse>) => {
  const { filtersDataStore } = useFiltersDataContextValue();
  const { metaStore } = useTableConfigContextValue<TData>();

  return async ({
    dataSelector,
    dataTotalSelector,
    onLoadMore,
  }: FetchFilterDataArgs<TResponse>) => {
    const filtersDataState = filtersDataStore.get();
    const currentFilterData = filtersDataState?.[columnKey];

    if (!currentFilterData) {
      logger.error(
        '[useFetchFilterData] Filter data not initialized for column:',
        columnKey,
      );
      throw new Error(`Filter data not initialized for column: ${columnKey}`);
    }

    // Skip if already loaded or currently loading
    if (currentFilterData.data.length > 0 || currentFilterData.isLoading) {
      return;
    }

    if (!onLoadMore) {
      logger.error('[useFetchFilterData] onLoadMore callback is required');
      throw new Error('onLoadMore callback is required');
    }

    try {
      filtersDataStore.set({
        [columnKey]: {
          ...currentFilterData,
          isLoading: true,
        },
      });

      const response = await onLoadMore({
        limit: DEFAULT_FILTER_PAGE_SIZE,
        skip: 0,
      });

      const data = dataSelector ? dataSelector(response) : [];
      const totalRows = dataTotalSelector
        ? dataTotalSelector(response)
        : data.length;
      const hasMore = totalRows > data.length;

      filtersDataStore.set({
        [columnKey]: {
          ...currentFilterData,
          data,
          hasMore,
          isLoading: false,
          totalLoadedRows: data.length,
          totalRows,
        },
      });

      // Prefetch next page if enabled and more data exists
      const metaState = metaStore.get();
      const enablePrefetch = metaState?.enablePrefetch ?? false;

      if (enablePrefetch && hasMore && prefetchRef) {
        const { initialCache, resolution } = prefetchNextPageUtil({
          nextSkip: data.length,
          onLoadMore,
        });

        prefetchRef.current = initialCache;

        void resolution.then((resolvedCache) => {
          if (prefetchRef.current.skip === initialCache.skip) {
            prefetchRef.current = resolvedCache;
          }
        });
      }
    } catch (error) {
      logger.error('[useFetchFilterData] Error fetching filter data:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to load filter data';
      metaStore.set({
        error: message,
      });

      filtersDataStore.set({
        [columnKey]: {
          ...currentFilterData,
          isLoading: false,
        },
      });
    }
  };
};
