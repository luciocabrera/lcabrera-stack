import { getRequiredOnLoadMore } from '@repo/ui/components/Table/utils/getRequiredOnLoadMore.util';

import type {
  FetchFilterDataActionArgs,
  FetchFilterDataCallbackArgs,
} from './useFetchFilterData.types';

import { executeFetchMoreFilterData } from './executeFetchMoreFilterData.util';
import { handleFetchMoreFilterDataError } from './handleFetchMoreFilterDataError.util';

export type { FetchFilterDataActionArgs } from './useFetchFilterData.types';

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
      await executeFetchMoreFilterData({
        columnKey,
        currentData,
        currentFilter,
        dataSelector,
        dataTotalSelector,
        filtersDataStore,
        metaStore,
        prefetchRef,
        requiredOnLoadMore,
      });
    } catch (error) {
      handleFetchMoreFilterDataError({
        columnKey,
        currentFilter,
        error,
        filtersDataStore,
        metaStore,
      });
    }
  };

  return fetchMore;
};
