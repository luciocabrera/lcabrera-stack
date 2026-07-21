import type {
  FiltersDataState,
  TableMetaState,
} from '@lcabrera/ui/components/Table/Table.types';
import type { TStore } from '@lcabrera/ui/hooks/useStore.hook';

import { DEFAULT_FILTER_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { createMockStore } from '@lcabrera/ui/utils/tests/createMockStore.util';
import { describe, expect, it, vi } from 'vitest';

import { executeFetchMoreFilterData } from './executeFetchMoreFilterData.util';

type TestData = {
  readonly status: string;
};

type TestResponse = {
  readonly rows: readonly string[];
  readonly total: number;
};

const createDataStore = () => {
  return createMockStore({
    status: {
      data: ['Alpha'],
      hasMore: true,
      isLoading: false,
      isLoadingMore: false,
      searchText: '',
      totalLoadedRows: 1,
      totalRows: 3,
    },
  });
};

describe('executeFetchMoreFilterData', () => {
  it('appends the fetched page and updates totals', async () => {
    const filtersDataStore = createDataStore();
    const metaStore = createMockStore({ enablePrefetch: false });
    const currentFilter = filtersDataStore.get().status;
    const onLoadMore = vi.fn(async () => ({ rows: ['Bravo'], total: 3 }));

    await executeFetchMoreFilterData<TestData, TestResponse>({
      columnKey: 'status',
      currentData: currentFilter.data,
      currentFilter,
      dataSelector: (response) => response.rows,
      dataTotalSelector: (response) => response.total,
      filtersDataStore: filtersDataStore as unknown as TStore<
        FiltersDataState<TestData>
      >,
      metaStore: metaStore as unknown as TStore<TableMetaState>,
      requiredOnLoadMore: onLoadMore,
    });

    expect(onLoadMore).toHaveBeenCalledWith({
      limit: DEFAULT_FILTER_PAGE_SIZE,
      skip: 1,
    });
    expect(filtersDataStore.get().status).toMatchObject({
      data: ['Alpha', 'Bravo'],
      isLoadingMore: false,
      totalLoadedRows: 2,
      totalRows: 3,
    });
  });

  it('consumes matching prefetch cache and clears it afterwards', async () => {
    const filtersDataStore = createDataStore();
    const metaStore = createMockStore({ enablePrefetch: false });
    const currentFilter = filtersDataStore.get().status;
    const prefetchRef = {
      current: {
        data: { rows: ['Cached'], total: 3 },
        promise: undefined,
        skip: 1,
      },
    };
    const onLoadMore = vi.fn(async () => ({
      rows: ['ShouldNotBeUsed'],
      total: 3,
    }));

    await executeFetchMoreFilterData<TestData, TestResponse>({
      columnKey: 'status',
      currentData: currentFilter.data,
      currentFilter,
      dataSelector: (response) => response.rows,
      dataTotalSelector: (response) => response.total,
      filtersDataStore: filtersDataStore as unknown as TStore<
        FiltersDataState<TestData>
      >,
      metaStore: metaStore as unknown as TStore<TableMetaState>,
      prefetchRef,
      requiredOnLoadMore: onLoadMore,
    });

    expect(onLoadMore).not.toHaveBeenCalled();
    expect(filtersDataStore.get().status.data).toEqual(['Alpha', 'Cached']);
    expect(prefetchRef.current).toEqual({
      data: undefined,
      promise: undefined,
      skip: -1,
    });
  });
});
