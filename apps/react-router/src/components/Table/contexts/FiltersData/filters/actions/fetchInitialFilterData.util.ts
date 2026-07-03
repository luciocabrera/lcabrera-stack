import type { FiltersDataState } from '@/components/Table/Table.types';

import { DEFAULT_FILTER_PAGE_SIZE } from '@/components/Table/Table.constants';
import { getErrorMessage } from '@/components/Table/utils/getErrorMessage.util';
import { getRequiredOnLoadMore } from '@/components/Table/utils/getRequiredOnLoadMore.util';
import { logger } from '@/utils/logger';

import type {
  FetchFilterDataActionArgs,
  FetchFilterDataCallbackArgs,
} from './useFetchFilterData.types';

import { getTotalRows } from './getTotalRows.util';
import { maybePrefetchFilterPage } from './maybePrefetchFilterPage.util';
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

      maybePrefetchFilterPage({
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
