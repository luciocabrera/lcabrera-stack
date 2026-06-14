// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_FILTER_PAGE_SIZE } from '@/components/Table/Table.constants';
import { createPaginatedFetchActionMocks } from '@/components/test-utils/createPaginatedFetchActionMocks.util';

import { useFetchFilterData } from './useFetchFilterData.hook';

type TestData = {
  readonly status: string;
};

type TestResponse = {
  readonly rows: readonly string[];
  readonly total: number;
};

type TestFiltersState = {
  readonly status: {
    readonly data: readonly string[];
    readonly hasMore: boolean;
    readonly isLoading: boolean;
    readonly isLoadingMore: boolean;
    readonly totalLoadedRows: number;
    readonly totalRows: number;
  };
};

function createHarness() {
  return createPaginatedFetchActionMocks<TestFiltersState, TestResponse>({
    initialDataState: {
      status: {
        data: [],
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows: 0,
        totalRows: 0,
      },
    },
    initialMetaState: {
      enablePrefetch: false,
    },
  });
}

type Harness = ReturnType<typeof createHarness>;

let harness: Harness | undefined;

function getHarness(): Harness {
  if (!harness) {
    harness = createHarness();
  }

  return harness;
}

function mockUseFiltersDataContextValue() {
  return {
    filtersDataStore: getHarness().dataStore,
  };
}

function mockUseTableConfigContextValue() {
  return { metaStore: getHarness().metaStore };
}

const loggerErrorMock = vi.fn();

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

vi.mock('@/utils/prefetch/firePrefetch.util', () => ({
  firePrefetch: (...args: Parameters<Harness['firePrefetchMock']>) =>
    getHarness().firePrefetchMock(...args),
}));

vi.mock('@/utils/prefetch/resolveFromCacheOrFetch.util', () => ({
  resolveFromCacheOrFetch: (
    ...args: Parameters<Harness['resolveFromCacheOrFetchMock']>
  ) => getHarness().resolveFromCacheOrFetchMock(...args),
}));

const defaultSelectors = {
  dataSelector: (response: TestResponse) => [...response.rows],
  dataTotalSelector: (response: TestResponse) => response.total,
};

describe('useFetchFilterData', () => {
  beforeEach(() => {
    const currentHarness = getHarness();

    currentHarness.resetMocks();
    currentHarness.setDataState({
      status: {
        data: [],
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows: 0,
        totalRows: 0,
      },
    });
    currentHarness.setMetaState({ enablePrefetch: false });
    currentHarness.firePrefetchMock.mockReset();
    loggerErrorMock.mockReset();
    currentHarness.resolveFromCacheOrFetchMock.mockReset();
  });

  it('fetches the initial page and starts prefetching when enabled', async () => {
    getHarness().setMetaState({ enablePrefetch: true });

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
    expect(getHarness().firePrefetchMock).toHaveBeenCalledWith({
      limit: DEFAULT_FILTER_PAGE_SIZE,
      nextSkip: 2,
      onLoadMore,
      prefetchRef,
    });
  });

  it('skips the initial fetch when data is already loaded', async () => {
    getHarness().setDataState({
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
    getHarness().resolveFromCacheOrFetchMock.mockResolvedValue({
      rows: ['Bravo'],
      total: 3,
    });
    getHarness().setDataState({
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

    expect(getHarness().resolveFromCacheOrFetchMock).toHaveBeenCalledWith({
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

    expect(getHarness().metaStore.get()).toMatchObject({
      error: 'Broken filter API',
    });
    expect(loggerErrorMock).toHaveBeenCalled();
  });
});
