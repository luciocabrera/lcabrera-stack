import { useCallback, useRef } from 'react';

import type { InfiniteScroll, PrefetchCache } from '@/types/ui.types';

import { LOAD_MORE_PAGE_SIZE } from '@/components/Table/Table.constants';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { firePrefetch, resolveFromCacheOrFetch } from '@/utils/prefetch';

import { useTableDataContextValue } from '../useTableDataContextValue.hook.ts';

type FetchMoreDataArgs<TData, TResponse> = Omit<
  InfiniteScroll<TData, TResponse>,
  'hasMore' | 'isLoadingMore'
>;

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

        const response = await resolveFromCacheOrFetch({
          cache: prefetchRef.current,
          expectedSkip,
          fetchFn: () =>
            onLoadMore({
              limit: pageSize,
              skip: expectedSkip,
            }),
        });

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

        if (enablePrefetch && hasMore) {
          firePrefetch({
            limit: pageSize,
            nextSkip: combinedData.length,
            onLoadMore,
            prefetchRef,
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
