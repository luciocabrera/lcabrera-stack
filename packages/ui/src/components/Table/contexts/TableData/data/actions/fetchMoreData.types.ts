import type { RefObject } from 'react';

import type { TableMetaState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';
import type {
  InfiniteScroll,
  Pagination,
  PrefetchCache,
} from '#ui/types/ui.types';

export type CommitFetchMoreSuccessArgs<TData, TResponse> = {
  readonly currentData: readonly TData[];
  readonly currentTotalRows?: number;
  readonly dataSelector?: (response: TResponse) => readonly TData[];
  readonly dataStore: TStore<DataState<TData>>;
  readonly dataTotalSelector?: (response: TResponse) => number | undefined;
  readonly enablePrefetch: boolean;
  readonly pageSize: number;
  readonly prefetchRef: RefObject<PrefetchCache<TResponse>>;
  readonly requiredOnLoadMore: OnLoadMore<TData, TResponse>;
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

export type FetchMoreResponseArgs<TData, TResponse> = {
  readonly currentDataLength: number;
  readonly lastRow?: TData;
  readonly pageSize: number;
  readonly prefetchRef: RefObject<PrefetchCache<TResponse>>;
  readonly requiredOnLoadMore: OnLoadMore<TData, TResponse>;
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
  readonly requiredOnLoadMore: OnLoadMore<TData, TResponse>;
};

export type MaybePrefetchNextPageArgs<TData, TResponse> = {
  readonly enablePrefetch: boolean;
  readonly hasMore: boolean;
  readonly lastRow?: TData;
  readonly nextSkip: number;
  readonly onLoadMore: OnLoadMore<TData, TResponse>;
  readonly pageSize: number;
  readonly prefetchRef: RefObject<PrefetchCache<TResponse>>;
};

/** The load-more callback once `getRequiredOnLoadMore` has proven it exists. */
type OnLoadMore<TData, TResponse> = (
  params: Pagination<TData>,
) => Promise<TResponse>;
