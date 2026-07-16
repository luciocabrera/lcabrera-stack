import type { TableMetaState } from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';
import type { InfiniteScroll, PrefetchCache } from '@repo/ui/types/ui.types';
import type { RefObject } from 'react';

export type CommitFetchMoreSuccessArgs<TData, TResponse> = {
  readonly currentData: readonly TData[];
  readonly currentTotalRows?: number;
  readonly dataSelector?: (response: TResponse) => readonly TData[];
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

export type DataState<TData> = {
  readonly data: readonly TData[];
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly totalLoadedRows: number;
  readonly totalRows: number;
};

export type ExecuteFetchMoreArgs<TData, TResponse> = {
  readonly args: FetchMoreDataArgs<TData, TResponse>;
  readonly dataStore: TStore<DataState<TData>>;
  readonly isFetchingRef: RefObject<boolean>;
  readonly metaStore: TStore<TableMetaState>;
  readonly prefetchRef: RefObject<PrefetchCache<TResponse>>;
};

export type FetchMoreDataArgs<TData, TResponse> = Omit<
  InfiniteScroll<TData, TResponse>,
  'hasMore' | 'isLoadingMore'
>;

export type FetchMoreResponseArgs<TResponse> = {
  readonly currentDataLength: number;
  readonly pageSize: number;
  readonly prefetchRef: RefObject<PrefetchCache<TResponse>>;
  readonly requiredOnLoadMore: (args: {
    readonly limit: number;
    readonly skip: number;
  }) => Promise<TResponse>;
};

export type FetchMoreRuntimeArgs<TData, TResponse> = {
  readonly args: FetchMoreDataArgs<TData, TResponse>;
  readonly dataState: DataState<TData> | undefined;
  readonly metaState: TableMetaState | undefined;
};

export type FetchMoreRuntimeResult<TData, TResponse> = {
  readonly currentData: readonly TData[];
  readonly enablePrefetch: boolean;
  readonly pageSize: number;
  readonly requiredOnLoadMore: (args: {
    readonly limit: number;
    readonly skip: number;
  }) => Promise<TResponse>;
};

export type MaybePrefetchNextPageArgs<TResponse> = {
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
