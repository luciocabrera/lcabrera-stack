import { DEFAULT_FILTER_PAGE_SIZE } from '@repo/ui/components/Table/Table.constants';
import type {
  DataKey,
  FilterData,
  FiltersDataState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';
import { resolveFetchMoreState } from '@repo/ui/components/Table/utils/resolveFetchMoreState.util';
import type { TStore } from '@repo/ui/hooks/useStore.hook';
import { resolveFromCacheOrFetch } from '@repo/ui/utils/prefetch/resolveFromCacheOrFetch.util';

import { clearPrefetchIfPresent } from './clearPrefetchIfPresent.util';
import { maybePrefetchFilterPage } from './maybePrefetchFilterPage.util';
import type { FetchFilterDataActionArgs } from './useFetchFilterData.types';
import { setFilterSlice } from './setFilterSlice.util';

type ExecuteFetchMoreFilterDataArgs<TData, TResponse> = {
  readonly columnKey: DataKey<TData>;
  readonly currentData: readonly string[];
  readonly currentFilter: FilterData;
  readonly dataSelector?: (response: TResponse) => readonly string[];
  readonly dataTotalSelector?: (response: TResponse) => number;
  readonly filtersDataStore: TStore<FiltersDataState<TData>>;
  readonly metaStore: TStore<TableMetaState>;
  readonly prefetchRef?: FetchFilterDataActionArgs<
    TData,
    TResponse
  >['prefetchRef'];
  readonly requiredOnLoadMore: (args: {
    readonly limit: number;
    readonly skip: number;
  }) => Promise<TResponse>;
};

export const executeFetchMoreFilterData = async <TData, TResponse>({
  columnKey,
  currentData,
  currentFilter,
  dataSelector,
  dataTotalSelector,
  filtersDataStore,
  metaStore,
  prefetchRef,
  requiredOnLoadMore,
}: ExecuteFetchMoreFilterDataArgs<TData, TResponse>) => {
  const metaState = metaStore.get();
  const enablePrefetch = metaState?.enablePrefetch ?? false;

  setFilterSlice({
    columnKey,
    filter: { ...currentFilter, isLoadingMore: true },
    filtersDataStore,
  });

  const response = await resolveFromCacheOrFetch({
    cache: prefetchRef?.current,
    expectedSkip: currentData.length,
    fetchFn: () =>
      requiredOnLoadMore({
        limit: DEFAULT_FILTER_PAGE_SIZE,
        skip: currentData.length,
      }),
  });

  clearPrefetchIfPresent({ prefetchRef });

  const { combinedData, hasMore, totalLoadedRows, totalRows } =
    resolveFetchMoreState({
      currentData,
      currentTotalRows: currentFilter.totalRows,
      dataSelector,
      dataTotalSelector,
      response,
    });

  setFilterSlice({
    columnKey,
    filter: {
      ...currentFilter,
      data: combinedData,
      hasMore,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows,
      totalRows,
    },
    filtersDataStore,
  });

  maybePrefetchFilterPage({
    enablePrefetch,
    hasMore,
    nextSkip: totalLoadedRows,
    onLoadMore: requiredOnLoadMore,
    prefetchRef,
  });
};
