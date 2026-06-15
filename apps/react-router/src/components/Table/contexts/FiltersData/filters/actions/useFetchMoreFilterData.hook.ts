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

type ResolveFetchMoreStateArgs<TResponse> = {
  readonly currentData: readonly string[];
  readonly currentTotalRows: number;
  readonly dataSelector?: (response: TResponse) => readonly string[];
  readonly dataTotalSelector?: (response: TResponse) => number;
  readonly response: TResponse;
};

type ResolveFetchMoreStateResult = {
  readonly combinedData: readonly string[];
  readonly hasMore: boolean;
  readonly totalLoadedRows: number;
  readonly totalRows: number;
};

type MaybePrefetchArgs<TResponse> = {
  readonly enablePrefetch: boolean;
  readonly hasMore: boolean;
  readonly nextSkip: number;
  readonly onLoadMore: (args: {
    readonly limit: number;
    readonly skip: number;
  }) => Promise<TResponse>;
  readonly prefetchRef?: UseFetchFilterDataActionArgs<
    unknown,
    TResponse
  >['prefetchRef'];
};

const resolveFetchMoreState = <TResponse>({
  currentData,
  currentTotalRows,
  dataSelector,
  dataTotalSelector,
  response,
}: ResolveFetchMoreStateArgs<TResponse>): ResolveFetchMoreStateResult => {
  const data = dataSelector ? dataSelector(response) : [];
  const combinedData = [...currentData, ...data];
  const totalLoadedRows = combinedData.length;
  const totalRows = dataTotalSelector
    ? dataTotalSelector(response)
    : currentTotalRows || totalLoadedRows;

  return {
    combinedData,
    hasMore: totalRows > totalLoadedRows,
    totalLoadedRows,
    totalRows,
  };
};

const clearPrefetchIfPresent = <TResponse>({
  prefetchRef,
}: {
  readonly prefetchRef?: UseFetchFilterDataActionArgs<
    unknown,
    TResponse
  >['prefetchRef'];
}) => {
  if (!prefetchRef) {
    return;
  }

  clearPrefetchCache({ prefetchRef });
};

const maybePrefetchNextPage = <TResponse>({
  enablePrefetch,
  hasMore,
  nextSkip,
  onLoadMore,
  prefetchRef,
}: MaybePrefetchArgs<TResponse>) => {
  if (!(enablePrefetch && hasMore && prefetchRef)) {
    return;
  }

  firePrefetch({
    limit: DEFAULT_FILTER_PAGE_SIZE,
    nextSkip,
    onLoadMore,
    prefetchRef,
  });
};

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

      clearPrefetchIfPresent({ prefetchRef });

      const { combinedData, hasMore, totalLoadedRows, totalRows } =
        resolveFetchMoreState({
          currentData,
          currentTotalRows: currentFilter.totalRows,
          dataSelector,
          dataTotalSelector,
          response,
        });

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

      maybePrefetchNextPage({
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

      filtersDataStore.set({
        [columnKey]: { ...currentFilter, isLoadingMore: false },
      } as Partial<FiltersDataState<TData>>);
    }
  };

  return fetchMore;
};
