// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_FILTER_PAGE_SIZE } from '@/components/Table/Table.constants';

import { useFetchFilterData } from './useFetchFilterData.hook';

type TestData = {
  readonly status: string;
};

type TestResponse = {
  readonly rows: readonly string[];
  readonly total: number;
};

const {
  firePrefetchMock,
  loggerErrorMock,
  mockFiltersDataStore,
  mockMetaStore,
  mockUseFiltersDataContextValue,
  mockUseTableConfigContextValue,
  resolveFromCacheOrFetchMock,
  setFiltersDataState,
  setMetaStoreState,
} = vi.hoisted(() => {
  let filtersDataState = {
    status: {
      data: [] as string[],
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows: 0,
      totalRows: 0,
    },
  };
  let metaStoreState: Record<string, unknown> = {
    enablePrefetch: false,
  };

  const mockFiltersDataStore = {
    get: vi.fn(() => filtersDataState),
    set: vi.fn((value: Record<string, unknown>) => {
      filtersDataState = { ...filtersDataState, ...value };
    }),
  };

  const mockMetaStore = {
    get: vi.fn(() => metaStoreState),
    set: vi.fn(),
  };

  return {
    firePrefetchMock: vi.fn(),
    loggerErrorMock: vi.fn(),
    mockFiltersDataStore,
    mockMetaStore,
    mockUseFiltersDataContextValue: () => ({
      filtersDataStore: mockFiltersDataStore,
    }),
    mockUseTableConfigContextValue: () => ({ metaStore: mockMetaStore }),
    resolveFromCacheOrFetchMock: vi.fn(),
    setFiltersDataState: (nextState: typeof filtersDataState) => {
      filtersDataState = nextState;
      mockFiltersDataStore.set.mockClear();
    },
    setMetaStoreState: (nextState: Record<string, unknown>) => {
      metaStoreState = nextState;
      mockMetaStore.set.mockClear();
    },
  };
});

vi.mock(
  '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: mockUseTableConfigContextValue,
  }),
);

vi.mock('../../useFiltersDataContextValue.hook', () => ({
  useFiltersDataContextValue: mockUseFiltersDataContextValue,
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    error: loggerErrorMock,
  },
}));

vi.mock('@/utils/prefetch', () => ({
  firePrefetch: firePrefetchMock,
  resolveFromCacheOrFetch: resolveFromCacheOrFetchMock,
}));

const defaultSelectors = {
  dataSelector: (response: TestResponse) => [...response.rows],
  dataTotalSelector: (response: TestResponse) => response.total,
};

describe('useFetchFilterData', () => {
  beforeEach(() => {
    setFiltersDataState({
      status: {
        data: [],
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows: 0,
        totalRows: 0,
      },
    });
    setMetaStoreState({ enablePrefetch: false });
    firePrefetchMock.mockReset();
    loggerErrorMock.mockReset();
    mockFiltersDataStore.get.mockClear();
    mockFiltersDataStore.set.mockClear();
    resolveFromCacheOrFetchMock.mockReset();
  });

  it('fetches the initial page and starts prefetching when enabled', async () => {
    setMetaStoreState({ enablePrefetch: true });

    const onLoadMore = vi.fn(() =>
      Promise.resolve({
        rows: ['Alpha', 'Bravo'],
        total: 4,
      }),
    );
    const prefetchRef = {
      current: { data: undefined, promise: undefined, skip: -1 },
    };

    const { result } = renderHook(() =>
      useFetchFilterData<TestData, TestResponse>({
        columnKey: 'status',
        prefetchRef,
      }),
    );

    await act(async () => {
      await result.current.fetchInitial({
        ...defaultSelectors,
        onLoadMore,
      });
    });

    expect(onLoadMore).toHaveBeenCalledWith({
      limit: DEFAULT_FILTER_PAGE_SIZE,
      skip: 0,
    });
    expect(firePrefetchMock).toHaveBeenCalledWith({
      limit: DEFAULT_FILTER_PAGE_SIZE,
      nextSkip: 2,
      onLoadMore,
      prefetchRef,
    });
  });

  it('skips the initial fetch when data is already loaded', async () => {
    setFiltersDataState({
      status: {
        data: ['Existing'],
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows: 1,
        totalRows: 1,
      },
    });
    const onLoadMore = vi.fn();

    const { result } = renderHook(() =>
      useFetchFilterData<TestData, TestResponse>({
        columnKey: 'status',
      }),
    );

    await act(async () => {
      await result.current.fetchInitial({
        ...defaultSelectors,
        onLoadMore,
      });
    });

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('appends more filter data from the cache resolver and clears the consumed prefetch entry', async () => {
    resolveFromCacheOrFetchMock.mockResolvedValue({
      rows: ['Bravo'],
      total: 3,
    });
    setFiltersDataState({
      status: {
        data: ['Alpha'],
        hasMore: true,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows: 1,
        totalRows: 3,
      },
    });
    const prefetchRef = {
      current: {
        data: { rows: ['Bravo'], total: 3 } as TestResponse,
        promise: undefined,
        skip: 1,
      },
    };
    const initialCache = prefetchRef.current;
    const onLoadMore = vi.fn();

    const { result } = renderHook(() =>
      useFetchFilterData<TestData, TestResponse>({
        columnKey: 'status',
        prefetchRef,
      }),
    );

    await act(async () => {
      await result.current.fetchMore({
        ...defaultSelectors,
        onLoadMore,
      });
    });

    expect(resolveFromCacheOrFetchMock).toHaveBeenCalledWith({
      cache: initialCache,
      expectedSkip: 1,
      fetchFn: expect.any(Function),
    });
    expect(prefetchRef.current).toEqual({
      data: undefined,
      promise: undefined,
      skip: -1,
    });
  });

  it('captures fetch errors on the meta store and resets loading state', async () => {
    const onLoadMore = vi.fn(() =>
      Promise.reject(new Error('Broken filter API')),
    );

    const { result } = renderHook(() =>
      useFetchFilterData<TestData, TestResponse>({
        columnKey: 'status',
      }),
    );

    await act(async () => {
      await result.current.fetchInitial({
        ...defaultSelectors,
        onLoadMore,
      });
    });

    expect(mockMetaStore.set).toHaveBeenCalledWith({
      error: 'Broken filter API',
    });
    expect(loggerErrorMock).toHaveBeenCalled();
  });
});
