import type {
  FiltersDataState,
  TableMetaState,
} from '@lcabrera/ui/components/Table/Table.types';
import type { TStore } from '@lcabrera/ui/hooks/useStore.hook';

import { createMockStore } from '@lcabrera/ui/utils/tests/createMockStore.util';
import { describe, expect, it } from 'vitest';

import { handleFetchMoreFilterDataError } from './handleFetchMoreFilterDataError.util';

type TestData = {
  readonly status: string;
};

describe('handleFetchMoreFilterDataError', () => {
  it('stores the error message and resets loading-more state', () => {
    const filtersDataStore = createMockStore({
      status: {
        data: ['Alpha'],
        hasMore: true,
        isLoading: false,
        isLoadingMore: true,
        searchText: '',
        totalLoadedRows: 1,
        totalRows: 3,
      },
    });
    const metaStore = createMockStore<TableMetaState>({} as TableMetaState);

    handleFetchMoreFilterDataError<TestData>({
      columnKey: 'status',
      currentFilter: filtersDataStore.get().status,
      error: new Error('Network down'),
      filtersDataStore: filtersDataStore as unknown as TStore<
        FiltersDataState<TestData>
      >,
      metaStore: metaStore as unknown as TStore<TableMetaState>,
    });

    expect(metaStore.get().error).toBe('Network down');
    expect(filtersDataStore.get().status.isLoadingMore).toBe(false);
  });
});
