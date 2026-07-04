import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import type {
  UseFetchFilterDataArgs,
  UseFetchFilterDataReturn,
} from './useFetchFilterData.types';

import { useFiltersDataContextValue } from '../../useFiltersDataContextValue.hook';
import { fetchInitialFilterData } from './fetchInitialFilterData.util';
import { fetchMoreFilterData } from './fetchMoreFilterData.util';

/**
 * Hook that provides both initial and paginated filter data fetching
 * for a column. When `prefetchRef` is provided, automatically prefetches
 * the next page after each successful load (if `enablePrefetch` is on).
 */
export const useFetchFilterData = <TData, TResponse>({
  columnKey,
  prefetchRef,
}: UseFetchFilterDataArgs<
  TData,
  TResponse
>): UseFetchFilterDataReturn<TResponse> => {
  const { filtersDataStore } = useFiltersDataContextValue<TData>();
  const { metaStore } = useTableConfigContextValue<TData>();
  const fetchInitial = fetchInitialFilterData<TData, TResponse>({
    columnKey,
    filtersDataStore,
    metaStore,
    prefetchRef,
  });

  const fetchMore = fetchMoreFilterData<TData, TResponse>({
    columnKey,
    filtersDataStore,
    metaStore,
    prefetchRef,
  });

  return { fetchInitial, fetchMore };
};
