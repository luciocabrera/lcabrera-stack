import type { TableMetaState } from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';

import { LOAD_MORE_PAGE_SIZE } from '@/components/Table/Table.constants';
import { getErrorMessage } from '@/components/Table/utils/getErrorMessage.util';
import { getRequiredOnLoadMore } from '@/components/Table/utils/getRequiredOnLoadMore.util';
import { resolveFetchMoreState } from '@/components/Table/utils/resolveFetchMoreState.util';
import { clearPrefetchCache } from '@/utils/prefetch/clearPrefetchCache.util';
import { firePrefetch } from '@/utils/prefetch/firePrefetch.util';
import { resolveFromCacheOrFetch } from '@/utils/prefetch/resolveFromCacheOrFetch.util';

import type {
  CommitFetchMoreSuccessArgs,
  DataState,
  ExecuteFetchMoreArgs,
  FetchMoreResponseArgs,
  FetchMoreRuntimeArgs,
  FetchMoreRuntimeResult,
  MaybePrefetchNextPageArgs,
} from './fetchMoreData.types';

export const maybePrefetchNextPage = <TResponse>({
  enablePrefetch,
  hasMore,
  nextSkip,
  onLoadMore,
  pageSize,
  prefetchRef,
}: MaybePrefetchNextPageArgs<TResponse>) => {
  if (!(enablePrefetch && hasMore)) {
    return;
  }

  firePrefetch({
    limit: pageSize,
    nextSkip,
    onLoadMore,
    prefetchRef,
  });
};

export const getFetchMoreRuntime = <TData, TResponse>({
  args,
  dataState,
  metaState,
}: FetchMoreRuntimeArgs<TData, TResponse>): FetchMoreRuntimeResult<
  TData,
  TResponse
> => {
  const { onLoadMore } = args;
  const currentData = dataState?.data ?? [];

  return {
    currentData,
    enablePrefetch: metaState?.enablePrefetch ?? false,
    pageSize: metaState?.loadMorePageSize ?? LOAD_MORE_PAGE_SIZE,
    requiredOnLoadMore: getRequiredOnLoadMore(onLoadMore),
  };
};

export const fetchMoreResponse = async <TResponse>({
  currentDataLength,
  pageSize,
  prefetchRef,
  requiredOnLoadMore,
}: FetchMoreResponseArgs<TResponse>) => {
  return resolveFromCacheOrFetch({
    cache: prefetchRef.current,
    expectedSkip: currentDataLength,
    fetchFn: () =>
      requiredOnLoadMore({
        limit: pageSize,
        skip: currentDataLength,
      }),
  });
};

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

export const commitFetchMoreError = <TData>({
  dataStore,
  error,
  metaStore,
}: {
  readonly dataStore: TStore<DataState<TData>>;
  readonly error: unknown;
  readonly metaStore: TStore<TableMetaState>;
}) => {
  const message = getErrorMessage({
    error,
    fallback: 'Failed to load more data',
  });
  metaStore.set({
    error: message,
  });

  dataStore.set({
    isLoadingMore: false,
  });
};

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
