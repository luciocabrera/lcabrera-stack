// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  FiltersDataState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

import { DEFAULT_FILTER_PAGE_SIZE } from '@repo/ui/components/Table/Table.constants';
import { createPaginatedFetchActionMocks } from '@repo/ui/utils/tests/createPaginatedFetchActionMocks.util';

import { fetchInitialFilterData } from './fetchInitialFilterData.util';

type TestData = {
  readonly status: string;
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

type TestResponse = {
  readonly rows: readonly string[];
  readonly total: number;
};

const createHarness = () => {
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
};

type Harness = ReturnType<typeof createHarness>;

const harnessRef: { current: Harness | undefined } = {
  current: undefined,
};

const getHarness = (): Harness => {
  harnessRef.current ??= createHarness();
  return harnessRef.current;
};

const loggerMock = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('@repo/ui/utils/logger', () => ({
  logger: {
    error: loggerMock.error,
  },
}));

vi.mock('@repo/ui/utils/prefetch/firePrefetch.util', () => ({
  firePrefetch: (...args: Parameters<Harness['firePrefetchMock']>) =>
    getHarness().firePrefetchMock(...args),
}));

describe('fetchInitialFilterData', () => {
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
    loggerMock.error.mockReset();
  });

  it('loads initial options and triggers prefetch when enabled', async () => {
    getHarness().setMetaState({ enablePrefetch: true });
    const onLoadMore = vi.fn(() =>
      Promise.resolve({ rows: ['A', 'B'], total: 4 }),
    );
    const prefetchRef = {
      current: { data: undefined, promise: undefined, skip: -1 },
    };

    const { result } = renderHook(() =>
      fetchInitialFilterData<TestData, TestResponse>({
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
        onLoadMore,
      });
    });

    expect(onLoadMore).toHaveBeenCalledWith({
      limit: DEFAULT_FILTER_PAGE_SIZE,
      skip: 0,
    });
    expect(getHarness().firePrefetchMock).toHaveBeenCalled();
  });
});
