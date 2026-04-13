// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LOAD_MORE_PAGE_SIZE } from '@/components/Table/Table.constants';

import { useFetchMoreData } from './useFetchMoreData.hook.ts';

const {
  mockMetaStore,
  mockUseTableConfigContextValue,
  mockUseTableDataContextValue,
  setDataStoreState,
  setMetaStoreState,
} = vi.hoisted(() => {
  let dataStoreState = {
    data: [{ id: 1 }],
    hasMore: true,
    isLoading: false,
    isLoadingMore: false,
    totalLoadedRows: 1,
    totalRows: 3,
  };

  let metaStoreState: Record<string, unknown> = {
    enablePrefetch: false,
    loadMorePageSize: 50,
  };

  const mockDataStore = {
    get: vi.fn(() => dataStoreState),
    set: vi.fn((value: Record<string, unknown>) => {
      dataStoreState = { ...dataStoreState, ...value };
    }),
  };

  const mockMetaStore = {
    get: vi.fn(() => metaStoreState),
    set: vi.fn(),
  };

  return {
    mockMetaStore,
    mockUseTableConfigContextValue: () => ({ metaStore: mockMetaStore }),
    mockUseTableDataContextValue: () => ({ dataStore: mockDataStore }),
    setDataStoreState: (nextState: typeof dataStoreState) => {
      dataStoreState = nextState;
    },
    setMetaStoreState: (nextState: Record<string, unknown>) => {
      metaStoreState = nextState;
    },
  };
});

vi.mock(
  '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: mockUseTableConfigContextValue,
  }),
);

vi.mock('../useTableDataContextValue.hook', () => ({
  useTableDataContextValue: mockUseTableDataContextValue,
}));

type TestResponse = {
  readonly rows: readonly TestRow[];
  readonly total: number;
};
type TestRow = { readonly id: number };

const defaultSelectors = {
  dataSelector: (response: TestResponse) => [...response.rows],
  dataTotalSelector: (response: TestResponse) => response.total,
};

describe('useFetchMoreData', () => {
  beforeEach(() => {
    setDataStoreState({
      data: [{ id: 1 }],
      hasMore: true,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows: 1,
      totalRows: 3,
    });
    setMetaStoreState({
      enablePrefetch: false,
      loadMorePageSize: LOAD_MORE_PAGE_SIZE,
    });
    mockMetaStore.set.mockReset();
  });

  it('uses the latest loaded row count and prevents overlapping fetches', async () => {
    let resolveLoadMore: ((value: TestResponse) => void) | undefined;

    const onLoadMore = vi.fn(
      () =>
        new Promise<TestResponse>((resolve) => {
          resolveLoadMore = resolve;
        }),
    );

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
      resolveLoadMore?.({
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
    setMetaStoreState({ enablePrefetch: false, loadMorePageSize: 25 });

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

      // Only one call — no prefetch
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('fires a prefetch request after fetch completes when enabled and hasMore', async () => {
      setMetaStoreState({ enablePrefetch: true, loadMorePageSize: 50 });

      const onLoadMore = vi.fn(() =>
        Promise.resolve({ rows: [{ id: 2 }], total: 5 }),
      );

      const { result } = renderHook(() =>
        useFetchMoreData<TestRow, TestResponse>(),
      );

      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
      });

      // First call: normal fetch; second call: prefetch
      expect(onLoadMore).toHaveBeenCalledTimes(2);
      expect(onLoadMore).toHaveBeenNthCalledWith(1, { limit: 50, skip: 1 });
      expect(onLoadMore).toHaveBeenNthCalledWith(2, { limit: 50, skip: 2 });
    });

    it('does not prefetch when hasMore becomes false', async () => {
      setMetaStoreState({ enablePrefetch: true, loadMorePageSize: 50 });

      const onLoadMore = vi.fn(() =>
        Promise.resolve({ rows: [{ id: 2 }, { id: 3 }], total: 3 }),
      );

      const { result } = renderHook(() =>
        useFetchMoreData<TestRow, TestResponse>(),
      );

      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
      });

      // totalLoadedRows (3) === totalRows (3) → hasMore false → no prefetch
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it('uses cached prefetch data on next scroll (cache hit)', async () => {
      setMetaStoreState({ enablePrefetch: true, loadMorePageSize: 50 });

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

      // First fetch triggers prefetch
      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
        // Allow prefetch promise to resolve
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(onLoadMore).toHaveBeenCalledTimes(2);

      // Reset data store to reflect updated state after first fetch
      setDataStoreState({
        data: [{ id: 1 }, { id: 2 }],
        hasMore: true,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows: 2,
        totalRows: 5,
      });

      // Second fetch should use cached data — no new network call
      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
      });

      // Calls: 1 (normal) + 1 (prefetch) + 0 (cache hit) + 1 (new prefetch after hit) = 3
      expect(onLoadMore).toHaveBeenCalledTimes(3);
    });

    it('silently discards failed prefetch and falls back to normal fetch', async () => {
      setMetaStoreState({ enablePrefetch: true, loadMorePageSize: 50 });

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

      // First fetch triggers prefetch (which will fail)
      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
        await new Promise((r) => setTimeout(r, 0));
      });

      setDataStoreState({
        data: [{ id: 1 }, { id: 2 }],
        hasMore: true,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows: 2,
        totalRows: 5,
      });

      // Second fetch: prefetch failed → cache miss → normal fetch
      await act(async () => {
        await result.current({ ...defaultSelectors, onLoadMore });
      });

      // 1 (normal) + 1 (prefetch, failed) + 1 (cache miss, normal) + 1 (new prefetch) = 4
      expect(onLoadMore).toHaveBeenCalledTimes(4);
      expect(onLoadMore).toHaveBeenNthCalledWith(3, { limit: 50, skip: 2 });
    });
  });
});
