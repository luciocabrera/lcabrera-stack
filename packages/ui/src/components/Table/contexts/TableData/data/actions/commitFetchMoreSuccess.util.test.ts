import { firePrefetch } from '@lcabrera/ui/utils/prefetch/firePrefetch.util';
import { createMockStore } from '@lcabrera/ui/utils/tests/createMockStore.util';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DataState } from './fetchMoreData.types';

import { commitFetchMoreSuccess } from './commitFetchMoreSuccess.util';

vi.mock('@lcabrera/ui/utils/prefetch/firePrefetch.util', () => ({
  firePrefetch: vi.fn(),
}));

const firePrefetchMock = vi.mocked(firePrefetch);

type TestData = { readonly id: number };
type TestResponse = {
  readonly rows: readonly TestData[];
  readonly total: number;
};

const dataSelector = (response: TestResponse) => [...response.rows];
const dataTotalSelector = (response: TestResponse) => response.total;
const requiredOnLoadMore = vi.fn(() => Promise.resolve({ rows: [], total: 0 }));

const createDataStore = (overrides?: Partial<DataState<TestData>>) =>
  createMockStore<DataState<TestData>>({
    data: [{ id: 1 }],
    hasMore: true,
    isLoading: false,
    isLoadingMore: true,
    totalLoadedRows: 1,
    totalRows: 5,
    ...overrides,
  });

const makePrefetchRef = () => ({
  current: {
    data: { rows: [{ id: 2 }], total: 5 } as TestResponse,
    promise: undefined,
    skip: 1,
  },
});

describe('commitFetchMoreSuccess', () => {
  beforeEach(() => {
    firePrefetchMock.mockClear();
  });

  it('updates dataStore with combined data and correct derived state', () => {
    const dataStore = createDataStore();
    const prefetchRef = makePrefetchRef();

    commitFetchMoreSuccess({
      currentData: [{ id: 1 }],
      currentTotalRows: 5,
      dataSelector,
      dataStore: dataStore as never,
      dataTotalSelector,
      enablePrefetch: false,
      pageSize: 50,
      prefetchRef,
      requiredOnLoadMore,
      response: { rows: [{ id: 2 }, { id: 3 }], total: 5 },
    });

    expect(dataStore.get()).toMatchObject({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      hasMore: true,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows: 3,
      totalRows: 5,
    });
  });

  it('clears the prefetch cache after committing', () => {
    const dataStore = createDataStore();
    const prefetchRef = makePrefetchRef();

    commitFetchMoreSuccess({
      currentData: [{ id: 1 }],
      currentTotalRows: 5,
      dataSelector,
      dataStore: dataStore as never,
      dataTotalSelector,
      enablePrefetch: false,
      pageSize: 50,
      prefetchRef,
      requiredOnLoadMore,
      response: { rows: [{ id: 2 }], total: 5 },
    });

    expect(prefetchRef.current.data).toBeUndefined();
    expect(prefetchRef.current.promise).toBeUndefined();
  });

  it('fires prefetch for the next page when enablePrefetch is true and hasMore', () => {
    const dataStore = createDataStore();
    const prefetchRef = makePrefetchRef();

    commitFetchMoreSuccess({
      currentData: [{ id: 1 }],
      currentTotalRows: 10,
      dataSelector,
      dataStore: dataStore as never,
      dataTotalSelector,
      enablePrefetch: true,
      pageSize: 50,
      prefetchRef,
      requiredOnLoadMore,
      response: { rows: [{ id: 2 }], total: 10 },
    });

    expect(firePrefetchMock).toHaveBeenCalledOnce();
    expect(firePrefetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, nextSkip: 2 }),
    );
  });

  it('does not fire prefetch when enablePrefetch is false', () => {
    const dataStore = createDataStore();
    const prefetchRef = makePrefetchRef();

    commitFetchMoreSuccess({
      currentData: [{ id: 1 }],
      currentTotalRows: 10,
      dataSelector,
      dataStore: dataStore as never,
      dataTotalSelector,
      enablePrefetch: false,
      pageSize: 50,
      prefetchRef,
      requiredOnLoadMore,
      response: { rows: [{ id: 2 }], total: 10 },
    });

    expect(firePrefetchMock).not.toHaveBeenCalled();
  });
});
