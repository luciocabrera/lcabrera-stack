import { describe, expect, it } from 'vite-plus/test';

import { createMockStore } from '#ui/utils/tests/createMockStore.util';

import type { DataState } from './fetchMoreData.types';

import { commitFetchMoreError } from './commitFetchMoreError.util';

type TestData = { readonly id: number };

const createDataStore = () =>
  createMockStore<DataState<TestData>>({
    data: [],
    error: undefined,
    hasMore: true,
    isLoading: false,
    isLoadingMore: true,
    totalLoadedRows: 0,
    totalRows: 0,
  });

describe('commitFetchMoreError', () => {
  it('writes a db-failed error from an Error instance onto dataStore', () => {
    const dataStore = createDataStore();

    commitFetchMoreError({
      dataStore: dataStore as never,
      error: new Error('network timeout'),
    });

    expect(dataStore.get()).toMatchObject({
      error: { kind: 'db-failed', message: 'network timeout' },
      isLoadingMore: false,
    });
  });

  it('writes an unexpected error for non-Error values', () => {
    const dataStore = createDataStore();

    commitFetchMoreError({
      dataStore: dataStore as never,
      error: 'string error',
    });

    expect(dataStore.get()).toMatchObject({
      error: { kind: 'unexpected', message: 'Failed to load more data' },
      isLoadingMore: false,
    });
  });

  it('maps an AbortError to db-canceled', () => {
    const dataStore = createDataStore();

    commitFetchMoreError({
      dataStore: dataStore as never,
      error: new DOMException('The user aborted a request.', 'AbortError'),
    });

    expect(dataStore.get().error).toEqual({
      kind: 'db-canceled',
      message: 'The user aborted a request.',
    });
  });
});
