import type { RefObject } from 'react';
import type { InfiniteScroll, PrefetchCache } from '@/types/ui.types';

import { DEFAULT_FILTER_PAGE_SIZE } from '@/components/Table/Table.constants';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useFiltersDataContextValue } from '../../useFiltersDataContextValue.hook';
import { prefetchNextPage as prefetchNextPageUtil } from './prefetchNextPage.util';
import type { DataKey } from '@/components/Table/Table.types';

type FetchMoreFilterDataArgs<TResponse> = Omit<
  InfiniteScroll<string, TResponse>,
  'hasMore' | 'isLoadingMore'
>;

type UseFetchMoreFilterDataArgs<TData, TResponse> = {
  readonly columnKey: DataKey<TData>;
  readonly prefetchRef?: RefObject<PrefetchCache<TResponse>>;
};

export const useFetchMoreFilterData = <TData, TResponse>({
  columnKey,
  prefetchRef,
}: UseFetchMoreFilterDataArgs<TData, TResponse>) => {
  const { filtersDataStore } = useFiltersDataContextValue();
  const { metaStore } = useTableConfigContextValue<TData>();

  return async ({
    dataSelector,
    dataTotalSelector,
    onLoadMore,
  }: FetchMoreFilterDataArgs<TResponse>) => {
    const filtersDataState = filtersDataStore.get();
    const currentFilter = filtersDataState?.[columnKey];
    const currentData = currentFilter?.data ?? [];
    const currentDataLength = currentData.length;

    if (!onLoadMore) {
      throw new Error('onLoadMore callback is required');
    }

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

      let response: TResponse;
      const cache = prefetchRef?.current;

      if (cache?.skip === currentDataLength && cache.data) {
        response = cache.data;
      } else if (cache?.skip === currentDataLength && cache.promise) {
        response = await cache.promise;
      } else {
        response = await onLoadMore({
          limit: DEFAULT_FILTER_PAGE_SIZE,
          skip: currentDataLength,
        });
      }

      if (prefetchRef) {
        prefetchRef.current = {
          data: undefined,
          promise: undefined,
          skip: -1,
        };
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

      // Fire prefetch for next page if enabled and more data exists
      const metaState = metaStore.get();
      const enablePrefetch = metaState?.enablePrefetch ?? false;

      if (enablePrefetch && hasMore && prefetchRef) {
        const { initialCache, resolution } = prefetchNextPageUtil({
          nextSkip: totalLoadedRows,
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
      const message =
        error instanceof Error ? error.message : 'Failed to load more data';
      metaStore.set({
        error: message,
      });

      filtersDataStore.set({
        [columnKey]: {
          ...currentFilter,
          isLoadingMore: false,
        },
      });
    }
  };
};
