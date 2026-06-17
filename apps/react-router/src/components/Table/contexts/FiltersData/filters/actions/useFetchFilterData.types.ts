import type { RefObject } from 'react';

import type {
  DataKey,
  FiltersDataState,
  TableMetaState,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';
import type { InfiniteScroll, PrefetchCache } from '@/types/ui.types';

export type FetchFilterDataCallbackArgs<TResponse> = Omit<
  InfiniteScroll<string, TResponse>,
  'hasMore' | 'isLoadingMore'
>;

export type UseFetchFilterDataActionArgs<TData, TResponse> = {
  readonly columnKey: DataKey<TData>;
  readonly filtersDataStore: TStore<FiltersDataState<TData>>;
  readonly metaStore: TStore<TableMetaState>;
  readonly prefetchRef?: RefObject<PrefetchCache<TResponse>>;
};

export type UseFetchFilterDataArgs<TData, TResponse> = {
  readonly columnKey: DataKey<TData>;
  readonly prefetchRef?: RefObject<PrefetchCache<TResponse>>;
};

export type UseFetchFilterDataReturn<TResponse> = {
  readonly fetchInitial: (
    args: FetchFilterDataCallbackArgs<TResponse>,
  ) => Promise<void>;
  readonly fetchMore: (
    args: FetchFilterDataCallbackArgs<TResponse>,
  ) => Promise<void>;
};
