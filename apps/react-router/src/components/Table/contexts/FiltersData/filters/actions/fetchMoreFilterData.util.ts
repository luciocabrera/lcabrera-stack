import type { RefObject } from 'react';

import type {
  DataKey,
  FiltersDataState,
  TableMetaState,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';
import type { PrefetchCache } from '@/types/ui.types';

import { DEFAULT_FILTER_PAGE_SIZE } from '@/components/Table/Table.constants';
import { getErrorMessage } from '@/components/Table/utils/getErrorMessage.util';
import { getRequiredOnLoadMore } from '@/components/Table/utils/getRequiredOnLoadMore.util';
import { resolveFetchMoreState } from '@/components/Table/utils/resolveFetchMoreState.util';
import { clearPrefetchCache } from '@/utils/prefetch/clearPrefetchCache.util';
import { firePrefetch } from '@/utils/prefetch/firePrefetch.util';
import { resolveFromCacheOrFetch } from '@/utils/prefetch/resolveFromCacheOrFetch.util';

import type { FetchFilterDataCallbackArgs } from './useFetchFilterData.types';

export type FetchFilterDataActionArgs<TData, TResponse> = {
  readonly columnKey: DataKey<TData>;
  readonly filtersDataStore: TStore<FiltersDataState<TData>>;
  readonly metaStore: TStore<TableMetaState>;
  readonly prefetchRef?: RefObject<PrefetchCache<TResponse>>;
};

type MaybePrefetchArgs<TResponse> = {
  readonly enablePrefetch: boolean;
  readonly hasMore: boolean;
  readonly nextSkip: number;
  readonly onLoadMore: (args: {
    readonly limit: number;
    readonly skip: number;
  }) => Promise<TResponse>;
  readonly prefetchRef?: FetchFilterDataActionArgs<
    unknown,
    TResponse
  >['prefetchRef'];
};

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
