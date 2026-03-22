// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFetchMoreData } from './useFetchMoreData.hook';

const {
  mockMetaStore,
  mockUseTableConfigContextValue,
  mockUseTableDataContextValue,
  setDataStoreState,
} = vi.hoisted(() => {
  let dataStoreState = {
    data: [{ id: 1 }],
    hasMore: true,
    isLoading: false,
    isLoadingMore: false,
    totalLoadedRows: 1,
    totalRows: 3,
  };

  const mockDataStore = {
    get: vi.fn(() => dataStoreState),
    set: vi.fn((value: Record<string, unknown>) => {
      dataStoreState = { ...dataStoreState, ...value };
    }),
  };

  const mockMetaStore = {
    set: vi.fn(),
  };

  return {
    mockMetaStore,
    mockUseTableConfigContextValue: () => ({ metaStore: mockMetaStore }),
    mockUseTableDataContextValue: () => ({ dataStore: mockDataStore }),
    setDataStoreState: (nextState: typeof dataStoreState) => {
      dataStoreState = nextState;
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
    mockMetaStore.set.mockReset();
  });

  it('uses the latest loaded row count and prevents overlapping fetches', async () => {
    let resolveLoadMore:
      | ((value: {
          readonly rows: readonly { readonly id: number }[];
          readonly total: number;
        }) => void)
      | undefined;

    const onLoadMore = vi.fn(
      () =>
        new Promise<{
          readonly rows: readonly { readonly id: number }[];
          readonly total: number;
        }>((resolve) => {
          resolveLoadMore = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useFetchMoreData<
        { readonly id: number },
        {
          readonly rows: readonly { readonly id: number }[];
          readonly total: number;
        }
      >(),
    );

    let firstPromise: Promise<void> | undefined;
    let secondPromise: Promise<void> | undefined;

    await act(async () => {
      firstPromise = result.current({
        dataSelector: (response) => [...response.rows],
        dataTotalSelector: (response) => response.total,
        onLoadMore,
      });
      secondPromise = result.current({
        dataSelector: (response) => [...response.rows],
        dataTotalSelector: (response) => response.total,
        onLoadMore,
      });

      await Promise.resolve();
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(onLoadMore).toHaveBeenCalledWith({
      limit: 50,
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
        dataSelector: (response) => [...response.rows],
        dataTotalSelector: (response) => response.total,
        onLoadMore,
      });
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
