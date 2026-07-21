import type {
  DataKey,
  FiltersDataState,
  TableMetaState,
} from '@lcabrera/ui/components/Table/Table.types';
import type { TStore } from '@lcabrera/ui/hooks/useStore.hook';
import type {
  InfiniteScroll,
  PrefetchCache,
} from '@lcabrera/ui/types/ui.types';
import type { RefObject } from 'react';

export type FetchFilterDataActionArgs<TData, TResponse> = {
  readonly columnKey: DataKey<TData>;
  readonly filtersDataStore: TStore<FiltersDataState<TData>>;
  readonly metaStore: TStore<TableMetaState>;
  readonly prefetchRef?: RefObject<PrefetchCache<TResponse>>;
};

export type FetchFilterDataCallbackArgs<TResponse> = Omit<
  InfiniteScroll<string, TResponse>,
  'hasMore' | 'isLoadingMore'
>;

export type MaybePrefetchArgs<TResponse> = {
  readonly enablePrefetch: boolean;
  readonly hasMore: boolean;
  readonly nextSkip: number;
  readonly onLoadMore: (args: {
    readonly limit: number;
    readonly skip: number;
  }) => Promise<TResponse>;
  readonly prefetchRef?: FetchFilterDataActionArgs<
    unknown,
    TResponse
  >['prefetchRef'];
};

export type UseFetchFilterDataArgs<TData, TResponse> = {
  readonly columnKey: DataKey<TData>;
  readonly prefetchRef?: RefObject<PrefetchCache<TResponse>>;
};
