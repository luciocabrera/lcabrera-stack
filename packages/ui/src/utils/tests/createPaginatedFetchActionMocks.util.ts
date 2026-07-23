import type { PrefetchCache } from '@lcabrera/ui/types/ui.types';

import { vi } from 'vite-plus/test';

import { createMockStore } from './createMockStore.util';

type CallableMock<TArgs extends readonly unknown[], TReturn> = ((
  ...args: TArgs
) => TReturn) & {
  readonly mockClear: () => void;
  readonly mockReset: () => void;
  readonly mockResolvedValue: (
    value: Awaited<TReturn>,
  ) => CallableMock<TArgs, TReturn>;
};

type CreatePaginatedFetchActionMocksArgs<TDataState> = {
  readonly initialDataState: TDataState;
  readonly initialMetaState: Record<string, unknown>;
};

type CreatePaginatedFetchActionMocksResult<TDataState, TResponse> = {
  readonly createPrefetchRef: () => {
    current: PrefetchCache<TResponse>;
  };
  readonly dataStore: ReturnType<typeof createMockStore<TDataState>>;
  readonly firePrefetchMock: CallableMock<[FirePrefetchArgs<TResponse>], void>;
  readonly metaStore: ReturnType<
    typeof createMockStore<Record<string, unknown>>
  >;
  readonly resetMocks: () => void;
  readonly resolveFromCacheOrFetchMock: CallableMock<
    [ResolveFromCacheOrFetchArgs<TResponse>],
    Promise<TResponse>
  >;
  readonly setDataState: (nextState: TDataState) => void;
  readonly setMetaState: (nextState: Record<string, unknown>) => void;
};

type FirePrefetchArgs<TResponse> = {
  readonly limit: number;
  readonly nextSkip: number;
  readonly onLoadMore: (params: {
    readonly limit: number;
    readonly skip: number;
  }) => Promise<TResponse>;
  readonly prefetchRef: {
    current: PrefetchCache<TResponse>;
  };
};

type ResolveFromCacheOrFetchArgs<TResponse> = {
  readonly cache: PrefetchCache<TResponse> | undefined;
  readonly expectedSkip: number;
  readonly fetchFn: () => Promise<TResponse>;
};

export const createPaginatedFetchActionMocks = <TDataState, TResponse>({
  initialDataState,
  initialMetaState,
}: CreatePaginatedFetchActionMocksArgs<TDataState>): CreatePaginatedFetchActionMocksResult<
  TDataState,
  TResponse
> => {
  const dataStore = createMockStore(initialDataState);
  const metaStore = createMockStore(initialMetaState);

  const resolveFromCacheOrFetchMock = vi.fn(
    async ({
      cache,
      expectedSkip,
      fetchFn,
    }: ResolveFromCacheOrFetchArgs<TResponse>) => {
      if (cache?.skip === expectedSkip && cache.data) {
        return cache.data;
      }

      if (cache?.skip === expectedSkip && cache.promise) {
        return cache.promise;
      }

      return fetchFn();
    },
  ) as CallableMock<
    [ResolveFromCacheOrFetchArgs<TResponse>],
    Promise<TResponse>
  >;

  const firePrefetchMock = vi.fn(
    ({
      limit,
      nextSkip,
      onLoadMore,
      prefetchRef,
    }: FirePrefetchArgs<TResponse>) => {
      void onLoadMore({ limit, skip: nextSkip })
        .then((response: TResponse) => {
          prefetchRef.current = {
            data: response,
            promise: undefined,
            skip: nextSkip,
          };
        })
        .catch(() => {
          /* mock: swallow the rejection */
        });
    },
  ) as CallableMock<[FirePrefetchArgs<TResponse>], void>;

  return {
    createPrefetchRef: () => ({
      current: { data: undefined, promise: undefined, skip: -1 },
    }),
    dataStore,
    firePrefetchMock,
    metaStore,
    resetMocks: () => {
      dataStore.reset(initialDataState);
      metaStore.reset(initialMetaState);
      firePrefetchMock.mockClear();
      resolveFromCacheOrFetchMock.mockClear();
    },
    resolveFromCacheOrFetchMock,
    setDataState: (nextState) => {
      dataStore.reset(nextState);
    },
    setMetaState: (nextState) => {
      metaStore.reset(nextState);
    },
  };
};
