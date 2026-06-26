import type { ExecuteFetchMoreArgs } from './fetchMoreData.types';

import { commitFetchMoreError } from './commitFetchMoreError.util';
import { commitFetchMoreSuccess } from './commitFetchMoreSuccess.util';
import { fetchMoreResponse } from './fetchMoreResponse.util';
import { getFetchMoreRuntime } from './getFetchMoreRuntime.util';

export const executeFetchMore = async <TData, TResponse>({
  args,
  dataStore,
  isFetchingRef,
  metaStore,
  prefetchRef,
}: ExecuteFetchMoreArgs<TData, TResponse>) => {
  const { dataSelector, dataTotalSelector } = args;
  const dataState = dataStore.get();
  const metaState = metaStore.get();
  const { currentData, enablePrefetch, pageSize, requiredOnLoadMore } =
    getFetchMoreRuntime({
      args,
      dataState,
      metaState,
    });

  if (isFetchingRef.current || dataState?.hasMore === false) {
    return;
  }

  isFetchingRef.current = true;

  try {
    dataStore.set({
      isLoadingMore: true,
    });

    const response = await fetchMoreResponse({
      currentDataLength: currentData.length,
      pageSize,
      prefetchRef,
      requiredOnLoadMore,
    });

    commitFetchMoreSuccess({
      currentData,
      currentTotalRows: dataState?.totalRows,
      dataSelector,
      dataStore,
      dataTotalSelector,
      enablePrefetch,
      pageSize,
      prefetchRef,
      requiredOnLoadMore,
      response,
    });
  } catch (error) {
    commitFetchMoreError({
      dataStore,
      error,
      metaStore,
    });
  } finally {
    isFetchingRef.current = false;
  }
};
