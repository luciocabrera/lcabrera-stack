import { createMockStore } from '@repo/ui/utils/tests/createMockStore.util';
import { describe, expect, it } from 'vitest';

import type { DataState } from './fetchMoreData.types';

import { commitFetchMoreError } from './commitFetchMoreError.util';

type MetaState = {
  readonly enablePrefetch: boolean;
  readonly error?: string;
};

type TestData = { readonly id: number };

const createStores = () => ({
  dataStore: createMockStore<DataState<TestData>>({
    data: [],
    hasMore: true,
    isLoading: false,
    isLoadingMore: true,
    totalLoadedRows: 0,
    totalRows: 0,
  }),
  metaStore: createMockStore<MetaState>({
    enablePrefetch: false,
  }),
});

describe('commitFetchMoreError', () => {
  it('writes the error message from an Error instance to metaStore', () => {
    const { dataStore, metaStore } = createStores();

    commitFetchMoreError({
      dataStore: dataStore as never,
      error: new Error('network timeout'),
      metaStore: metaStore as never,
    });

    expect(metaStore.get()).toMatchObject({ error: 'network timeout' });
  });

  it('writes the fallback message for non-Error values', () => {
    const { dataStore, metaStore } = createStores();

    commitFetchMoreError({
      dataStore: dataStore as never,
      error: 'string error',
      metaStore: metaStore as never,
    });

    expect(metaStore.get()).toMatchObject({
      error: 'Failed to load more data',
    });
  });

  it('sets isLoadingMore to false in dataStore', () => {
    const { dataStore, metaStore } = createStores();

    commitFetchMoreError({
      dataStore: dataStore as never,
      error: new Error('oops'),
      metaStore: metaStore as never,
    });

    expect(dataStore.get()).toMatchObject({ isLoadingMore: false });
  });
});
