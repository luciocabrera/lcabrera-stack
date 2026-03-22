import { useCallback, useRef } from 'react';

import type { InfiniteScroll } from '@/types/ui.types';

import { LOAD_MORE_PAGE_SIZE } from '@/components/Table/Table.constants';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDataContextValue } from '../useTableDataContextValue.hook';

type FetchMoreDataArgs<TData, TResponse> = Omit<
  InfiniteScroll<TData, TResponse>,
  'hasMore' | 'isLoadingMore'
>;

type PrefetchCache<TResponse> = {
  readonly data: TResponse | undefined;
  readonly promise: Promise<TResponse> | undefined;
  readonly skip: number;
};

export const useFetchMoreData = <TData, TResponse>() => {
  const { dataStore } = useTableDataContextValue<TData>();
  const { metaStore } = useTableConfigContextValue<TData>();
  const isFetchingRef = useRef(false);
  const prefetchRef = useRef<PrefetchCache<TResponse>>({
    data: undefined,
    promise: undefined,
    skip: -1,
  });

  return useCallback(
    async ({
      dataSelector,
      dataTotalSelector,
      onLoadMore,
    }: FetchMoreDataArgs<TData, TResponse>) => {
      const dataState = dataStore.get();
      const metaState = metaStore.get();
      const currentData = dataState?.data ?? [];
      const pageSize = metaState?.loadMorePageSize ?? LOAD_MORE_PAGE_SIZE;
      const enablePrefetch = metaState?.enablePrefetch ?? false;

      if (!onLoadMore) {
        throw new Error('onLoadMore callback is required');
      }

      if (isFetchingRef.current || dataState?.hasMore === false) {
        return;
      }

      isFetchingRef.current = true;

      try {
        dataStore.set({
          isLoadingMore: true,
        });

        const expectedSkip = currentData.length;
        let response: TResponse;
        const cache = prefetchRef.current;

        if (cache.skip === expectedSkip && cache.data) {
          // Cache HIT — use prefetched data directly
          response = cache.data;
        } else if (cache.skip === expectedSkip && cache.promise) {
          // Cache IN-FLIGHT — await the already-started prefetch
          response = await cache.promise;
        } else {
          // Cache MISS — normal fetch
          response = await onLoadMore({
            limit: pageSize,
            skip: expectedSkip,
          });
        }

        // Reset cache after consumption
        prefetchRef.current = { data: undefined, promise: undefined, skip: -1 };

        const data = dataSelector
          ? dataSelector(response)
          : ([] as unknown as TData[]);
        const combinedData = [...currentData, ...data];
        const totalLoadedRows = combinedData.length;
        const totalRows = dataTotalSelector
          ? dataTotalSelector(response)
          : (dataState?.totalRows ?? totalLoadedRows);
        const hasMore = totalRows > totalLoadedRows;

        dataStore.set({
          data: combinedData,
          hasMore,
          isLoading: false,
          isLoadingMore: false,
          totalLoadedRows,
          totalRows,
        });

        // Fire prefetch for next page if enabled and more data exists
        if (enablePrefetch && hasMore) {
          const nextSkip = combinedData.length;
          const prefetchPromise = onLoadMore({
            limit: pageSize,
            skip: nextSkip,
          });

          prefetchRef.current = {
            data: undefined,
            promise: prefetchPromise,
            skip: nextSkip,
          };

          // Resolve in background — store result for next scroll trigger
          prefetchPromise
            .then((prefetchedResponse) => {
              // Only store if the cache hasn't been invalidated
              if (prefetchRef.current.skip === nextSkip) {
                prefetchRef.current = {
                  data: prefetchedResponse,
                  promise: undefined,
                  skip: nextSkip,
                };
              }
            })
            .catch(() => {
              // Silently discard failed prefetch — next scroll will fetch normally
              if (prefetchRef.current.skip === nextSkip) {
                prefetchRef.current = {
                  data: undefined,
                  promise: undefined,
                  skip: -1,
                };
              }
            });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load more data';
        metaStore.set({
          error: message,
        });

        dataStore.set({
          isLoadingMore: false,
        });
      } finally {
        isFetchingRef.current = false;
      }
    },
    [dataStore, metaStore],
  );
};
