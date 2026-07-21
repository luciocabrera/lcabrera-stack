import { resolveFetchMoreState } from '@lcabrera/ui/components/Table/utils/resolveFetchMoreState.util';
import { clearPrefetchCache } from '@lcabrera/ui/utils/prefetch/clearPrefetchCache.util';

import type { CommitFetchMoreSuccessArgs } from './fetchMoreData.types';

import { maybePrefetchNextPage } from './maybePrefetchNextPage.util';

export const commitFetchMoreSuccess = <TData, TResponse>({
  currentData,
  currentTotalRows,
  dataSelector,
  dataStore,
  dataTotalSelector,
  enablePrefetch,
  pageSize,
  prefetchRef,
  requiredOnLoadMore,
  response,
}: CommitFetchMoreSuccessArgs<TData, TResponse>) => {
  clearPrefetchCache({ prefetchRef });

  const { combinedData, hasMore, totalLoadedRows, totalRows } =
    resolveFetchMoreState({
      currentData,
      currentTotalRows,
      dataSelector,
      dataTotalSelector,
      response,
    });

  dataStore.set({
    data: combinedData,
    hasMore,
    isLoading: false,
    isLoadingMore: false,
    totalLoadedRows,
    totalRows,
  });

  maybePrefetchNextPage({
    enablePrefetch,
    hasMore,
    nextSkip: combinedData.length,
    onLoadMore: requiredOnLoadMore,
    pageSize,
    prefetchRef,
  });
};
