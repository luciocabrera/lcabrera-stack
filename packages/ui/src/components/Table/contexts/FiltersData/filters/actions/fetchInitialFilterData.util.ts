import { DEFAULT_FILTER_PAGE_SIZE } from '#ui/components/Table/Table.constants';
import { getRequiredOnLoadMore } from '#ui/components/Table/utils/getRequiredOnLoadMore.util';
import { toTableResponseError } from '#ui/components/Table/utils/toTableResponseError.util';
import { logger } from '#ui/utils/logger';

import type {
  FetchFilterDataActionArgs,
  FetchFilterDataCallbackArgs,
} from './useFetchFilterData.types';

import { getTotalRows } from './getTotalRows.util';
import { maybePrefetchFilterPage } from './maybePrefetchFilterPage.util';
import { setFilterSlice } from './setFilterSlice.util';
import { shouldSkipInitialFetch } from './shouldSkipInitialFetch.util';

export type { FetchFilterDataActionArgs } from './useFetchFilterData.types';

export const fetchInitialFilterData = <TData, TResponse>({
  columnKey,
  filtersDataStore,
  metaStore,
  prefetchRef,
}: FetchFilterDataActionArgs<TData, TResponse>) => {
  const fetchInitial = async ({
    dataSelector,
    dataTotalSelector,
    onLoadMore,
    signal,
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

    if (shouldSkipInitialFetch({ currentFilter })) {
      return;
    }

    const requiredOnLoadMore = getRequiredOnLoadMore(onLoadMore);
    const restoreIdleSlice = () => {
      setFilterSlice({
        columnKey,
        filter: { ...currentFilter, isLoading: false },
        filtersDataStore,
      });
    };

    try {
      setFilterSlice({
        columnKey,
        filter: { ...currentFilter, isLoading: true },
        filtersDataStore,
      });

      const response = await requiredOnLoadMore({
        limit: DEFAULT_FILTER_PAGE_SIZE,
        skip: 0,
      });

      if (signal?.aborted) {
        restoreIdleSlice();
        return;
      }

      const data = dataSelector ? dataSelector(response) : [];
      const totalRows = getTotalRows({ data, dataTotalSelector, response });
      const hasMore = totalRows > data.length;

      setFilterSlice({
        columnKey,
        filter: {
          ...currentFilter,
          data,
          error: undefined,
          hasMore,
          isLoading: false,
          totalLoadedRows: data.length,
          totalRows,
        },
        filtersDataStore,
      });

      const metaState = metaStore.get();
      const enablePrefetch = metaState?.enablePrefetch ?? false;

      maybePrefetchFilterPage({
        enablePrefetch,
        hasMore,
        nextSkip: data.length,
        onLoadMore: requiredOnLoadMore,
        prefetchRef,
      });
    } catch (error) {
      if (signal?.aborted) {
        restoreIdleSlice();
        return;
      }

      logger.error('[useFetchFilterData] Error fetching filter data:', error);

      setFilterSlice({
        columnKey,
        filter: {
          ...currentFilter,
          error: toTableResponseError({
            error,
            fallback: 'Failed to load filter data',
          }),
          isLoading: false,
        },
        filtersDataStore,
      });
    }
  };

  return fetchInitial;
};
