import { DEFAULT_FILTER_PAGE_SIZE } from '@/components/Table/Table.constants';
import type { FiltersDataState } from '@/components/Table/Table.types';
import { getErrorMessage } from '@/components/Table/utils/getErrorMessage.util';
import { getRequiredOnLoadMore } from '@/components/Table/utils/getRequiredOnLoadMore.util';
import { clearPrefetchCache } from '@/utils/prefetch/clearPrefetchCache.util';
import { firePrefetch } from '@/utils/prefetch/firePrefetch.util';
import { resolveFromCacheOrFetch } from '@/utils/prefetch/resolveFromCacheOrFetch.util';

import type {
  FetchFilterDataCallbackArgs,
  UseFetchFilterDataActionArgs,
} from './useFetchFilterData.types';

export const useFetchMoreFilterData = <TData, TResponse>({
  columnKey,
  filtersDataStore,
  metaStore,
  prefetchRef,
}: UseFetchFilterDataActionArgs<TData, TResponse>) => {
  const fetchMore = async ({
    dataSelector,
    dataTotalSelector,
    onLoadMore,
  }: FetchFilterDataCallbackArgs<TResponse>) => {
    const filtersDataState = filtersDataStore.get();
    const currentFilter = filtersDataState?.[columnKey];
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
      } as Partial<FiltersDataState<TData>>);

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
      } as Partial<FiltersDataState<TData>>);

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
      } as Partial<FiltersDataState<TData>>);
    }
  };

  return fetchMore;
};
