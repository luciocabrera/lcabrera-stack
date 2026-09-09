import { describe, expect, it } from 'vite-plus/test';

import type { FiltersDataState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { createMockStore } from '#ui/utils/tests/createMockStore.util';

import { handleFetchMoreFilterDataError } from './handleFetchMoreFilterDataError.util';

type TestData = {
  readonly status: string;
};

describe('handleFetchMoreFilterDataError', () => {
  it('stores the error kind on the column and resets loading-more state', () => {
    const filtersDataStore = createMockStore({
      status: {
        data: ['Alpha'],
        error: undefined,
        hasMore: true,
        isLoading: false,
        isLoadingMore: true,
        searchText: '',
        totalLoadedRows: 1,
        totalRows: 3,
      },
    });

    handleFetchMoreFilterDataError<TestData>({
      columnKey: 'status',
      currentFilter: filtersDataStore.get().status,
      error: new Error('Network down'),
      filtersDataStore: filtersDataStore as unknown as TStore<
        FiltersDataState<TestData>
      >,
    });

    expect(filtersDataStore.get().status.error).toEqual({
      kind: 'db-failed',
      message: 'Network down',
    });
    expect(filtersDataStore.get().status.isLoadingMore).toBe(false);
  });
});
