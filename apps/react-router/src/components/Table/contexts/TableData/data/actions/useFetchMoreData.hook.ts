import { useCallback, useRef } from 'react';
import type { RefObject } from 'react';

import type { InfiniteScroll, PrefetchCache } from '@/types/ui.types';

import { LOAD_MORE_PAGE_SIZE } from '@/components/Table/Table.constants';
import type { TableMetaState } from '@/components/Table/Table.types';
import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { getErrorMessage } from '@/components/Table/utils/getErrorMessage.util';
import { getRequiredOnLoadMore } from '@/components/Table/utils/getRequiredOnLoadMore.util';
import { resolveFetchMoreState } from '@/components/Table/utils/resolveFetchMoreState.util';
import type { TStore } from '@/hooks/useStore.hook';
import { clearPrefetchCache } from '@/utils/prefetch/clearPrefetchCache.util';
import { firePrefetch } from '@/utils/prefetch/firePrefetch.util';
import { resolveFromCacheOrFetch } from '@/utils/prefetch/resolveFromCacheOrFetch.util';

import { useTableDataContextValue } from '../useTableDataContextValue.hook';

type FetchMoreDataArgs<TData, TResponse> = Omit<
  InfiniteScroll<TData, TResponse>,
  'hasMore' | 'isLoadingMore'
>;

type DataState<TData> = {
  readonly data: TData[];
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly totalLoadedRows: number;
  readonly totalRows: number;
};

type MaybePrefetchNextPageArgs<TResponse> = {
  readonly enablePrefetch: boolean;
  readonly hasMore: boolean;
  readonly nextSkip: number;
  readonly onLoadMore: (args: {
    readonly limit: number;
    readonly skip: number;
  }) => Promise<TResponse>;
  readonly pageSize: number;
  readonly prefetchRef: RefObject<PrefetchCache<TResponse>>;
};

type ExecuteFetchMoreArgs<TData, TResponse> = {
  readonly args: FetchMoreDataArgs<TData, TResponse>;
  readonly dataStore: TStore<DataState<TData>>;
  readonly isFetchingRef: RefObject<boolean>;
  readonly metaStore: TStore<TableMetaState>;
  readonly prefetchRef: RefObject<PrefetchCache<TResponse>>;
};

type FetchMoreRuntimeArgs<TData, TResponse> = {
  readonly args: FetchMoreDataArgs<TData, TResponse>;
  readonly dataState: DataState<TData> | undefined;
  readonly metaState: TableMetaState | undefined;
};

type FetchMoreRuntimeResult<TData, TResponse> = {
  readonly currentData: TData[];
  readonly enablePrefetch: boolean;
  readonly pageSize: number;
  readonly requiredOnLoadMore: (args: {
    readonly limit: number;
    readonly skip: number;
  }) => Promise<TResponse>;
};

type FetchMoreResponseArgs<TResponse> = {
  readonly currentDataLength: number;
  readonly pageSize: number;
  readonly prefetchRef: RefObject<PrefetchCache<TResponse>>;
  readonly requiredOnLoadMore: (args: {
    readonly limit: number;
    readonly skip: number;
  }) => Promise<TResponse>;
};

type CommitFetchMoreSuccessArgs<TData, TResponse> = {
  readonly currentData: TData[];
  readonly currentTotalRows?: number;
  readonly dataSelector?: (response: TResponse) => TData[];
  readonly dataStore: TStore<DataState<TData>>;
  readonly dataTotalSelector?: (response: TResponse) => number;
  readonly enablePrefetch: boolean;
  readonly pageSize: number;
  readonly prefetchRef: RefObject<PrefetchCache<TResponse>>;
  readonly requiredOnLoadMore: (args: {
    readonly limit: number;
    readonly skip: number;
  }) => Promise<TResponse>;
  readonly response: TResponse;
};

const maybePrefetchNextPage = <TResponse>({
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

const getFetchMoreRuntime = <TData, TResponse>({
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

const fetchMoreResponse = async <TResponse>({
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

const commitFetchMoreSuccess = <TData, TResponse>({
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

const commitFetchMoreError = <TData>({
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

const executeFetchMore = async <TData, TResponse>({
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

export const useFetchMoreData = <TData, TResponse>() => {
  const { dataStore } = useTableDataContextValue<TData>();
  const { metaStore } = useTableConfigContextValue<TData>();
  const isFetchingRef = useRef(false);
  const prefetchRef = useRef<PrefetchCache<TResponse>>({
    data: undefined,
    promise: undefined,
    skip: -1,
  });

  return useCallback(
    async (args: FetchMoreDataArgs<TData, TResponse>) =>
      executeFetchMore({
        args,
        dataStore,
        isFetchingRef,
        metaStore,
        prefetchRef,
      }),
    [dataStore, metaStore],
  );
};
