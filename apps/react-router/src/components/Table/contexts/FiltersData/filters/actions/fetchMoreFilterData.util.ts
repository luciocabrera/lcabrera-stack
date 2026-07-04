import { DEFAULT_FILTER_PAGE_SIZE } from '@/components/Table/Table.constants';
import { getErrorMessage } from '@/components/Table/utils/getErrorMessage.util';
import { getRequiredOnLoadMore } from '@/components/Table/utils/getRequiredOnLoadMore.util';
import { resolveFetchMoreState } from '@/components/Table/utils/resolveFetchMoreState.util';
import { clearPrefetchCache } from '@/utils/prefetch/clearPrefetchCache.util';
import { resolveFromCacheOrFetch } from '@/utils/prefetch/resolveFromCacheOrFetch.util';

import type {
  FetchFilterDataActionArgs,
  FetchFilterDataCallbackArgs,
} from './useFetchFilterData.types';

import { maybePrefetchFilterPage } from './maybePrefetchFilterPage.util';
import { setFilterSlice } from './setFilterSlice.util';

export type { FetchFilterDataActionArgs } from './useFetchFilterData.types';

const clearPrefetchIfPresent = <TResponse>({
  prefetchRef,
}: {
  readonly prefetchRef?: FetchFilterDataActionArgs<
    unknown,
    TResponse
  >['prefetchRef'];
}) => {
  if (!prefetchRef) {
    return;
  }

  clearPrefetchCache({ prefetchRef });
};

export const fetchMoreFilterData = <TData, TResponse>({
  columnKey,
  filtersDataStore,
  metaStore,
  prefetchRef,
}: FetchFilterDataActionArgs<TData, TResponse>) => {
  const fetchMore = async ({
    dataSelector,
    dataTotalSelector,
    onLoadMore,
  }: FetchFilterDataCallbackArgs<TResponse>) => {
    const filtersDataState = filtersDataStore.get();
    const currentFilter = filtersDataState?.[columnKey];

    if (!currentFilter) {
      throw new Error(`Filter data not initialized for column: ${columnKey}`);
    }

    if (currentFilter.isLoadingMore || currentFilter.hasMore === false) {
      return;
    }

    const currentData = currentFilter.data;
    const requiredOnLoadMore = getRequiredOnLoadMore(onLoadMore);

    try {
      setFilterSlice({
        columnKey,
        filter: { ...currentFilter, isLoadingMore: true },
        filtersDataStore,
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

      clearPrefetchIfPresent({ prefetchRef });

      const { combinedData, hasMore, totalLoadedRows, totalRows } =
        resolveFetchMoreState({
          currentData,
          currentTotalRows: currentFilter.totalRows,
          dataSelector,
          dataTotalSelector,
          response,
        });

      setFilterSlice({
        columnKey,
        filter: {
          ...currentFilter,
          data: combinedData,
          hasMore,
          isLoading: false,
          isLoadingMore: false,
          totalLoadedRows,
          totalRows,
        },
        filtersDataStore,
      });

      const metaState = metaStore.get();
      const enablePrefetch = metaState?.enablePrefetch ?? false;

      maybePrefetchFilterPage({
        enablePrefetch,
        hasMore,
        nextSkip: totalLoadedRows,
        onLoadMore: requiredOnLoadMore,
        prefetchRef,
      });
    } catch (error) {
      const message = getErrorMessage({
        error,
        fallback: 'Failed to load more data',
      });
      metaStore.set({ error: message });

      setFilterSlice({
        columnKey,
        filter: { ...currentFilter, isLoadingMore: false },
        filtersDataStore,
      });
    }
  };

  return fetchMore;
};
