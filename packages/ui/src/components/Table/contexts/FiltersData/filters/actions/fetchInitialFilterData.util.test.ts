// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type {
  FilterData,
  FiltersDataState,
  TableMetaState,
} from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { DEFAULT_FILTER_PAGE_SIZE } from '#ui/components/Table/Table.constants';
import { createPaginatedFetchActionMocks } from '#ui/utils/tests/createPaginatedFetchActionMocks.util';
import { emptyFilterData } from '#ui/utils/tests/emptyFilterData.util';
import { invokeColumnFilterFetch } from '#ui/utils/tests/invokeColumnFilterFetch.util';

import { fetchInitialFilterData } from './fetchInitialFilterData.util';

type TestData = {
  readonly status: string;
};

type TestFiltersState = {
  readonly status: FilterData;
};

type TestResponse = {
  readonly rows: readonly string[];
  readonly total: number;
};

const createHarness = () => {
  return createPaginatedFetchActionMocks<TestFiltersState, TestResponse>({
    initialDataState: {
      status: emptyFilterData(),
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

vi.mock('#ui/utils/logger', () => ({
  logger: {
    error: loggerMock.error,
  },
}));

vi.mock('#ui/utils/prefetch/firePrefetch.util', () => ({
  firePrefetch: (...args: Parameters<Harness['firePrefetchMock']>) =>
    getHarness().firePrefetchMock(...args),
}));

describe('fetchInitialFilterData', () => {
  beforeEach(() => {
    const currentHarness = getHarness();
    currentHarness.resetMocks();
    currentHarness.setDataState({
      status: emptyFilterData(),
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

    await invokeColumnFilterFetch({
      createFetch: () =>
        fetchInitialFilterData<TestData, TestResponse>({
          columnKey: 'status',
          filtersDataStore: getHarness().dataStore as unknown as TStore<
            FiltersDataState<TestData>
          >,
          metaStore: getHarness()
            .metaStore as unknown as TStore<TableMetaState>,
          prefetchRef,
        }),
      onLoadMore,
    });

    expect(onLoadMore).toHaveBeenCalledWith({
      limit: DEFAULT_FILTER_PAGE_SIZE,
      skip: 0,
    });
    expect(getHarness().firePrefetchMock).toHaveBeenCalled();
  });

  it('writes a db-failed error onto the column when the request fails', async () => {
    const onLoadMore = vi.fn(() => Promise.reject(new Error('Network down')));

    await invokeColumnFilterFetch({
      createFetch: () =>
        fetchInitialFilterData<TestData, TestResponse>({
          columnKey: 'status',
          filtersDataStore: getHarness().dataStore as unknown as TStore<
            FiltersDataState<TestData>
          >,
          metaStore: getHarness()
            .metaStore as unknown as TStore<TableMetaState>,
        }),
      onLoadMore,
    });

    expect(getHarness().dataStore.get().status.error).toEqual({
      kind: 'db-failed',
      message: 'Network down',
    });
    expect(getHarness().dataStore.get().status.isLoading).toBe(false);
    expect(loggerMock.error).toHaveBeenCalled();
  });
});
