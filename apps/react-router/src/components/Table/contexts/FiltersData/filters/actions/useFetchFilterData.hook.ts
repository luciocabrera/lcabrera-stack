import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useFiltersDataContextValue } from '../../useFiltersDataContextValue.hook';

import { useFetchInitialFilterData } from './useFetchInitialFilterData.hook';
import { useFetchMoreFilterData } from './useFetchMoreFilterData.hook';
import type {
  UseFetchFilterDataArgs,
  UseFetchFilterDataReturn,
} from './useFetchFilterData.types';

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
  const fetchInitial = useFetchInitialFilterData<TData, TResponse>({
    columnKey,
    filtersDataStore,
    metaStore,
    prefetchRef,
  });

  const fetchMore = useFetchMoreFilterData<TData, TResponse>({
    columnKey,
    filtersDataStore,
    metaStore,
    prefetchRef,
  });

  return { fetchInitial, fetchMore };
};
