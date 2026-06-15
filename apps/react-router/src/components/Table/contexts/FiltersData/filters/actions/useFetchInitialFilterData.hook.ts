import { DEFAULT_FILTER_PAGE_SIZE } from '@/components/Table/Table.constants';
import type { FiltersDataState } from '@/components/Table/Table.types';
import { getErrorMessage } from '@/components/Table/utils/getErrorMessage.util';
import { getRequiredOnLoadMore } from '@/components/Table/utils/getRequiredOnLoadMore.util';
import { logger } from '@/utils/logger';
import { firePrefetch } from '@/utils/prefetch/firePrefetch.util';

import { getTotalRows } from './getTotalRows.util';
import { shouldSkipInitialFetch } from './shouldSkipInitialFetch.util';
import type {
  FetchFilterDataCallbackArgs,
  UseFetchFilterDataActionArgs,
} from './useFetchFilterData.types';

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

const maybePrefetchInitialPage = <TResponse>({
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

export const useFetchInitialFilterData = <TData, TResponse>({
  columnKey,
  filtersDataStore,
  metaStore,
  prefetchRef,
}: UseFetchFilterDataActionArgs<TData, TResponse>) => {
  const fetchInitial = async ({
    dataSelector,
    dataTotalSelector,
    onLoadMore,
  }: FetchFilterDataCallbackArgs<TResponse>) => {
    const filtersDataState = filtersDataStore.get();
    const currentFilter = filtersDataState?.[columnKey];

    if (!currentFilter) {
      logger.error(
        '[useFetchFilterData] Filter data not initialized for column:',
        columnKey,
      );
      throw new Error(`Filter data not initialized for column: ${columnKey}`);
    }

    // Skip if already loaded or currently loading.
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
      } as Partial<FiltersDataState<TData>>);

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
      } as Partial<FiltersDataState<TData>>);

      const metaState = metaStore.get();
      const enablePrefetch = metaState?.enablePrefetch ?? false;

      maybePrefetchInitialPage({
        enablePrefetch,
        hasMore,
        nextSkip: data.length,
        onLoadMore: requiredOnLoadMore,
        prefetchRef,
      });
    } catch (error) {
      logger.error('[useFetchFilterData] Error fetching filter data:', error);
      const message = getErrorMessage({
        error,
        fallback: 'Failed to load filter data',
      });
      metaStore.set({ error: message });

      filtersDataStore.set({
        [columnKey]: { ...currentFilter, isLoading: false },
      } as Partial<FiltersDataState<TData>>);
    }
  };

  return fetchInitial;
};
