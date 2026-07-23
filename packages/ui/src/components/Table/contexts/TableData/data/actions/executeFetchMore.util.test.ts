import { resolveFromCacheOrFetch } from '@lcabrera/ui/utils/prefetch/resolveFromCacheOrFetch.util';
import { createMockStore } from '@lcabrera/ui/utils/tests/createMockStore.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { DataState } from './fetchMoreData.types';

import { executeFetchMore } from './executeFetchMore.util';

vi.mock('@lcabrera/ui/utils/prefetch/resolveFromCacheOrFetch.util', () => ({
  resolveFromCacheOrFetch: vi.fn(),
}));

vi.mock('@lcabrera/ui/utils/prefetch/firePrefetch.util', () => ({
  firePrefetch: vi.fn(),
}));

const resolveFromCacheOrFetchMock = vi.mocked(resolveFromCacheOrFetch);

type MetaState = {
  readonly enablePrefetch: boolean;
  readonly error?: string;
  readonly loadMorePageSize: number;
};
type TestData = { readonly id: number };
type TestResponse = {
  readonly rows: readonly TestData[];
  readonly total: number;
};

const dataSelector = (r: TestResponse) => [...r.rows];
const dataTotalSelector = (r: TestResponse) => r.total;
const onLoadMore = vi.fn(() => Promise.resolve({ rows: [], total: 0 }));

const createStores = (dataOverrides?: Partial<DataState<TestData>>) => ({
  dataStore: createMockStore<DataState<TestData>>({
    data: [{ id: 1 }],
    hasMore: true,
    isLoading: false,
    isLoadingMore: false,
    totalLoadedRows: 1,
    totalRows: 5,
    ...dataOverrides,
  }),
  metaStore: createMockStore<MetaState>({
    enablePrefetch: false,
    loadMorePageSize: 50,
  }),
});

const makePrefetchRef = () => ({
  current: { data: undefined, promise: undefined, skip: -1 },
});

describe('executeFetchMore', () => {
  beforeEach(() => {
    resolveFromCacheOrFetchMock.mockReset();
    onLoadMore.mockClear();
  });

  it('sets isLoadingMore before fetching and resolves to false after success', async () => {
    const { dataStore, metaStore } = createStores();
    const fetchingRef = { current: false };
    const prefetchRef = makePrefetchRef();

    resolveFromCacheOrFetchMock.mockResolvedValue({
      rows: [{ id: 2 }],
      total: 5,
    });

    await executeFetchMore({
      args: { dataSelector, dataTotalSelector, onLoadMore },
      dataStore: dataStore as never,
      isFetchingRef: fetchingRef,
      metaStore: metaStore as never,
      prefetchRef,
    });

    expect(dataStore.get()).toMatchObject({ isLoadingMore: false });
  });

  it('appends fetched rows and updates store state on success', async () => {
    const { dataStore, metaStore } = createStores();
    const fetchingRef = { current: false };
    const prefetchRef = makePrefetchRef();

    resolveFromCacheOrFetchMock.mockResolvedValue({
      rows: [{ id: 2 }, { id: 3 }],
      total: 5,
    });

    await executeFetchMore({
      args: { dataSelector, dataTotalSelector, onLoadMore },
      dataStore: dataStore as never,
      isFetchingRef: fetchingRef,
      metaStore: metaStore as never,
      prefetchRef,
    });

    expect(dataStore.get()).toMatchObject({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      hasMore: true,
      isLoadingMore: false,
      totalLoadedRows: 3,
      totalRows: 5,
    });
  });

  it('returns early when isFetchingRef is already true', async () => {
    const { dataStore, metaStore } = createStores();
    const fetchingRef = { current: true };
    const prefetchRef = makePrefetchRef();

    await executeFetchMore({
      args: { dataSelector, dataTotalSelector, onLoadMore },
      dataStore: dataStore as never,
      isFetchingRef: fetchingRef,
      metaStore: metaStore as never,
      prefetchRef,
    });

    expect(resolveFromCacheOrFetchMock).not.toHaveBeenCalled();
  });

  it('returns early when hasMore is false', async () => {
    const { dataStore, metaStore } = createStores({ hasMore: false });
    const fetchingRef = { current: false };
    const prefetchRef = makePrefetchRef();

    await executeFetchMore({
      args: { dataSelector, dataTotalSelector, onLoadMore },
      dataStore: dataStore as never,
      isFetchingRef: fetchingRef,
      metaStore: metaStore as never,
      prefetchRef,
    });

    expect(resolveFromCacheOrFetchMock).not.toHaveBeenCalled();
  });

  it('writes error message to metaStore and clears isLoadingMore on fetch failure', async () => {
    const { dataStore, metaStore } = createStores();
    const fetchingRef = { current: false };
    const prefetchRef = makePrefetchRef();

    resolveFromCacheOrFetchMock.mockRejectedValue(new Error('server error'));

    await executeFetchMore({
      args: { dataSelector, dataTotalSelector, onLoadMore },
      dataStore: dataStore as never,
      isFetchingRef: fetchingRef,
      metaStore: metaStore as never,
      prefetchRef,
    });

    expect(metaStore.get()).toMatchObject({ error: 'server error' });
    expect(dataStore.get()).toMatchObject({ isLoadingMore: false });
  });

  it('resets isFetchingRef to false after completion regardless of outcome', async () => {
    const { dataStore, metaStore } = createStores();
    const fetchingRef = { current: false };
    const prefetchRef = makePrefetchRef();

    resolveFromCacheOrFetchMock.mockRejectedValue(new Error('fail'));

    await executeFetchMore({
      args: { dataSelector, dataTotalSelector, onLoadMore },
      dataStore: dataStore as never,
      isFetchingRef: fetchingRef,
      metaStore: metaStore as never,
      prefetchRef,
    });

    expect(fetchingRef.current).toBe(false);
  });

  it('prevents a second concurrent fetch from running', async () => {
    const { dataStore, metaStore } = createStores();
    const fetchingRef = { current: false };
    const prefetchRef = makePrefetchRef();

    const { promise, resolve } = Promise.withResolvers<TestResponse>();

    resolveFromCacheOrFetchMock.mockReturnValue(promise);

    const firstFetch = executeFetchMore({
      args: { dataSelector, dataTotalSelector, onLoadMore },
      dataStore: dataStore as never,
      isFetchingRef: fetchingRef,
      metaStore: metaStore as never,
      prefetchRef,
    });

    const secondFetch = executeFetchMore({
      args: { dataSelector, dataTotalSelector, onLoadMore },
      dataStore: dataStore as never,
      isFetchingRef: fetchingRef,
      metaStore: metaStore as never,
      prefetchRef,
    });

    resolve({ rows: [{ id: 2 }], total: 5 });
    await firstFetch;
    await secondFetch;

    expect(resolveFromCacheOrFetchMock).toHaveBeenCalledTimes(1);
  });
});
