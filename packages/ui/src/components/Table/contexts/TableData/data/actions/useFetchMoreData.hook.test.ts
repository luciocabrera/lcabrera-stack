// @vitest-environment jsdom

import { LOAD_MORE_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { createPaginatedFetchActionMocks } from '@lcabrera/ui/utils/tests/createPaginatedFetchActionMocks.util';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFetchMoreData } from './useFetchMoreData.hook';

type TestDataState = {
  readonly data: readonly TestRow[];
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly totalLoadedRows: number;
  readonly totalRows: number;
};

type TestResponse = {
  readonly rows: readonly TestRow[];
  readonly total: number;
};

type TestRow = {
  readonly id: number;
};

const createHarness = () => {
  return createPaginatedFetchActionMocks<TestDataState, TestResponse>({
    initialDataState: {
      data: [{ id: 1 }],
      hasMore: true,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows: 1,
      totalRows: 3,
    },
    initialMetaState: {
      enablePrefetch: false,
      loadMorePageSize: 50,
    },
  });
};

type Harness = ReturnType<typeof createHarness>;

const harnessRef: { current: Harness | undefined } = {
  current: undefined,
};

const getHarness = (): Harness => {
  if (!harnessRef.current) {
    harnessRef.current = createHarness();
  }

  return harnessRef.current;
};

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ metaStore: getHarness().metaStore }),
  }),
);

vi.mock('../useTableDataContextValue.hook', () => ({
  useTableDataContextValue: () => ({ dataStore: getHarness().dataStore }),
}));

vi.mock('@lcabrera/ui/utils/prefetch/firePrefetch.util', () => ({
  firePrefetch: (...args: Parameters<Harness['firePrefetchMock']>) =>
    getHarness().firePrefetchMock(...args),
}));

vi.mock('@lcabrera/ui/utils/prefetch/resolveFromCacheOrFetch.util', () => ({
  resolveFromCacheOrFetch: (
    ...args: Parameters<Harness['resolveFromCacheOrFetchMock']>
  ) => getHarness().resolveFromCacheOrFetchMock(...args),
}));

const defaultSelectors = {
  dataSelector: (response: TestResponse) => [...response.rows],
  dataTotalSelector: (response: TestResponse) => response.total,
};

describe('useFetchMoreData', () => {
  beforeEach(() => {
    const currentHarness = getHarness();

    currentHarness.resetMocks();
    currentHarness.setDataState({
      data: [{ id: 1 }],
      hasMore: true,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows: 1,
      totalRows: 3,
    });
    currentHarness.setMetaState({
      enablePrefetch: false,
      loadMorePageSize: LOAD_MORE_PAGE_SIZE,
    });
  });

  it('uses the latest loaded row count and prevents overlapping fetches', async () => {
    const { promise, resolve } = Promise.withResolvers<TestResponse>();
    const onLoadMore = vi.fn(() => promise);

    const { result } = renderHook(() =>
      useFetchMoreData<TestRow, TestResponse>(),
    );

    let firstPromise: Promise<void> | undefined;
    let secondPromise: Promise<void> | undefined;

    await act(async () => {
      firstPromise = result.current({
        ...defaultSelectors,
        onLoadMore,
      });
      secondPromise = result.current({
        ...defaultSelectors,
        onLoadMore,
      });

      await Promise.resolve();
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(onLoadMore).toHaveBeenCalledWith({
      limit: LOAD_MORE_PAGE_SIZE,
      skip: 1,
    });

    await act(async () => {
      resolve({
        rows: [{ id: 2 }, { id: 3 }],
        total: 3,
      });
      await firstPromise;
      await secondPromise;
    });

    await act(async () => {
      await result.current({
        ...defaultSelectors,
        onLoadMore,
      });
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('uses configurable page size from metaStore', async () => {
    getHarness().setMetaState({ enablePrefetch: false, loadMorePageSize: 25 });

    const onLoadMore = vi.fn(() =>
      Promise.resolve({ rows: [{ id: 2 }], total: 3 }),
    );

    const { result } = renderHook(() =>
      useFetchMoreData<TestRow, TestResponse>(),
    );

    await act(async () => {
      await result.current({ ...defaultSelectors, onLoadMore });
    });

    expect(onLoadMore).toHaveBeenCalledWith({ limit: 25, skip: 1 });
  });

  it('returns early when hasMore is false', async () => {
    getHarness().setDataState({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows: 3,
      totalRows: 3,
    });

    const onLoadMore = vi.fn();

    const { result } = renderHook(() =>
      useFetchMoreData<TestRow, TestResponse>(),
    );

    await act(async () => {
      await result.current({ ...defaultSelectors, onLoadMore });
    });

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('stores error message and resets loading-more flag when fetch fails', async () => {
    const onLoadMore = vi.fn(() => Promise.reject(new Error('network down')));

    const { result } = renderHook(() =>
      useFetchMoreData<TestRow, TestResponse>(),
    );

    await act(async () => {
      await result.current({ ...defaultSelectors, onLoadMore });
    });

    expect(getHarness().metaStore.get()).toMatchObject({
      error: 'network down',
    });
    expect(getHarness().dataStore.get()).toMatchObject({
      isLoadingMore: false,
    });
  });

  describe('prefetch', () => {
    it('does not prefetch when enablePrefetch is false', async () => {
      const onLoadMore = vi.fn(() =>
        Promise.resolve({ rows: [{ id: 2 }], total: 3 }),
      );

      const { result } = renderHook(() =>
        useFetchMoreData<TestRow, TestResponse>(),
      );

      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
      });

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('fires a prefetch request after fetch completes when enabled and hasMore', async () => {
      getHarness().setMetaState({ enablePrefetch: true, loadMorePageSize: 50 });

      const onLoadMore = vi.fn(() =>
        Promise.resolve({ rows: [{ id: 2 }], total: 5 }),
      );

      const { result } = renderHook(() =>
        useFetchMoreData<TestRow, TestResponse>(),
      );

      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
      });

      expect(onLoadMore).toHaveBeenCalledTimes(2);
      expect(onLoadMore).toHaveBeenNthCalledWith(1, { limit: 50, skip: 1 });
      expect(onLoadMore).toHaveBeenNthCalledWith(2, { limit: 50, skip: 2 });
    });

    it('does not prefetch when hasMore becomes false', async () => {
      getHarness().setMetaState({ enablePrefetch: true, loadMorePageSize: 50 });

      const onLoadMore = vi.fn(() =>
        Promise.resolve({ rows: [{ id: 2 }, { id: 3 }], total: 3 }),
      );

      const { result } = renderHook(() =>
        useFetchMoreData<TestRow, TestResponse>(),
      );

      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
      });

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('uses cached prefetch data on next scroll (cache hit)', async () => {
      getHarness().setMetaState({ enablePrefetch: true, loadMorePageSize: 50 });

      const prefetchResponse: TestResponse = { rows: [{ id: 3 }], total: 5 };
      const onLoadMore = vi
        .fn<
          (params: { limit: number; skip: number }) => Promise<TestResponse>
        >()
        .mockResolvedValueOnce({ rows: [{ id: 2 }], total: 5 })
        .mockResolvedValueOnce(prefetchResponse);

      const { result } = renderHook(() =>
        useFetchMoreData<TestRow, TestResponse>(),
      );

      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(onLoadMore).toHaveBeenCalledTimes(2);

      getHarness().setDataState({
        data: [{ id: 1 }, { id: 2 }],
        hasMore: true,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows: 2,
        totalRows: 5,
      });

      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
      });

      expect(onLoadMore).toHaveBeenCalledTimes(3);
    });

    it('silently discards failed prefetch and falls back to normal fetch', async () => {
      getHarness().setMetaState({ enablePrefetch: true, loadMorePageSize: 50 });

      const onLoadMore = vi
        .fn<
          (params: { limit: number; skip: number }) => Promise<TestResponse>
        >()
        .mockResolvedValueOnce({ rows: [{ id: 2 }], total: 5 })
        .mockRejectedValueOnce(new Error('prefetch failed'))
        .mockResolvedValueOnce({ rows: [{ id: 3 }], total: 5 });

      const { result } = renderHook(() =>
        useFetchMoreData<TestRow, TestResponse>(),
      );

      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      getHarness().setDataState({
        data: [{ id: 1 }, { id: 2 }],
        hasMore: true,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows: 2,
        totalRows: 5,
      });

      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
      });

      expect(onLoadMore).toHaveBeenCalledTimes(4);
      expect(onLoadMore).toHaveBeenNthCalledWith(3, { limit: 50, skip: 2 });
    });
  });
});
