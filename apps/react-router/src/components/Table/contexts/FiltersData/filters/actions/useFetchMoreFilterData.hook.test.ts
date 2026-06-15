// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  FiltersDataState,
  TableMetaState,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks/useStore.hook';
import { createPaginatedFetchActionMocks } from '@/utils/tests/createPaginatedFetchActionMocks.util';

import { useFetchMoreFilterData } from './useFetchMoreFilterData.hook';

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

const createHarness = () => {
  return createPaginatedFetchActionMocks<TestFiltersState, TestResponse>({
    initialDataState: {
      status: {
        data: ['Alpha'],
        hasMore: true,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows: 1,
        totalRows: 3,
      },
    },
    initialMetaState: {
      enablePrefetch: false,
    },
  });
};

type Harness = ReturnType<typeof createHarness>;

let harness: Harness | undefined;

const getHarness = (): Harness => {
  harness ??= createHarness();
  return harness;
};

vi.mock('@/utils/prefetch/firePrefetch.util', () => ({
  firePrefetch: (...args: Parameters<Harness['firePrefetchMock']>) =>
    getHarness().firePrefetchMock(...args),
}));

vi.mock('@/utils/prefetch/resolveFromCacheOrFetch.util', () => ({
  resolveFromCacheOrFetch: (
    ...args: Parameters<Harness['resolveFromCacheOrFetchMock']>
  ) => getHarness().resolveFromCacheOrFetchMock(...args),
}));

describe('useFetchMoreFilterData', () => {
  beforeEach(() => {
    const currentHarness = getHarness();
    currentHarness.resetMocks();
    currentHarness.setMetaState({ enablePrefetch: false });
  });

  it('appends next page and clears consumed prefetch cache', async () => {
    getHarness().resolveFromCacheOrFetchMock.mockResolvedValue({
      rows: ['Bravo'],
      total: 3,
    });
    const prefetchRef = {
      current: {
        data: { rows: ['Bravo'], total: 3 } as TestResponse,
        promise: undefined,
        skip: 1,
      },
    };

    const { result } = renderHook(() =>
      useFetchMoreFilterData<TestData, TestResponse>({
        columnKey: 'status',
        filtersDataStore: getHarness().dataStore as unknown as TStore<
          FiltersDataState<TestData>
        >,
        metaStore: getHarness().metaStore as unknown as TStore<TableMetaState>,
        prefetchRef,
      }),
    );

    await act(async () => {
      await result.current({
        dataSelector: (response) => [...response.rows],
        dataTotalSelector: (response) => response.total,
        onLoadMore: vi.fn(),
      });
    });

    expect(getHarness().dataStore.get()).toMatchObject({
      status: {
        data: ['Alpha', 'Bravo'],
        totalLoadedRows: 2,
      },
    });
    expect(prefetchRef.current).toEqual({
      data: undefined,
      promise: undefined,
      skip: -1,
    });
  });

  it('returns early when the filter already has no more data', async () => {
    getHarness().dataStore.set({
      status: {
        data: ['Alpha'],
        hasMore: false,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows: 1,
        totalRows: 1,
      },
    });

    const { result } = renderHook(() =>
      useFetchMoreFilterData<TestData, TestResponse>({
        columnKey: 'status',
        filtersDataStore: getHarness().dataStore as unknown as TStore<
          FiltersDataState<TestData>
        >,
        metaStore: getHarness().metaStore as unknown as TStore<TableMetaState>,
      }),
    );

    await act(async () => {
      await result.current({
        dataSelector: (response) => [...response.rows],
        dataTotalSelector: (response) => response.total,
        onLoadMore: vi.fn(),
      });
    });

    expect(getHarness().resolveFromCacheOrFetchMock).not.toHaveBeenCalled();
  });

  it('returns early when the filter is already loading more', async () => {
    getHarness().dataStore.set({
      status: {
        data: ['Alpha'],
        hasMore: true,
        isLoading: false,
        isLoadingMore: true,
        totalLoadedRows: 1,
        totalRows: 3,
      },
    });

    const { result } = renderHook(() =>
      useFetchMoreFilterData<TestData, TestResponse>({
        columnKey: 'status',
        filtersDataStore: getHarness().dataStore as unknown as TStore<
          FiltersDataState<TestData>
        >,
        metaStore: getHarness().metaStore as unknown as TStore<TableMetaState>,
      }),
    );

    await act(async () => {
      await result.current({
        dataSelector: (response) => [...response.rows],
        dataTotalSelector: (response) => response.total,
        onLoadMore: vi.fn(),
      });
    });

    expect(getHarness().resolveFromCacheOrFetchMock).not.toHaveBeenCalled();
  });
});
