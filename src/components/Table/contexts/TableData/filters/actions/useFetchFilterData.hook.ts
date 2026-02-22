import { useCallback } from 'react';

import type { InfiniteScroll } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useFiltersDataContextValue } from '../../../FiltersData/useFiltersDataContextValue.hook';

type FetchFilterDataArgs<TData, TResponse> = Omit<
  InfiniteScroll<TData, TResponse>,
  'hasMore' | 'isLoadingMore'
>;

/**
 * Hook to fetch initial filter data for a column
 * Follows the same pattern as useFetchMoreData for consistency
 */
export const useFetchFilterData = <TData, TResponse>(columnKey: string) => {
  const { filtersDataStore } = useFiltersDataContextValue();
  const { metaStore } = useTableConfigContextValue<TData>();

  return useCallback(
    async ({
      dataSelector,
      dataTotalSelector,
      onLoadMore,
    }: FetchFilterDataArgs<TData, TResponse>) => {
      const filtersDataState = filtersDataStore.get();
      const currentFilterData = filtersDataState?.[columnKey];

      if (!currentFilterData) {
        console.error(
          '[useFetchFilterData] Filter data not initialized for column:',
          columnKey,
        );
        throw new Error(
          `Filter data not initialized for column: ${columnKey}`,
        );
      }

      // Skip if already loaded or currently loading
      if (currentFilterData.data.length > 0 || currentFilterData.isLoading) {
        return;
      }

      if (!onLoadMore) {
        console.error('[useFetchFilterData] onLoadMore callback is required');
        throw new Error('onLoadMore callback is required');
      }

      try {
        filtersDataStore.set({
          [columnKey]: {
            ...currentFilterData,
            isLoading: true,
          },
        });

        const response = await onLoadMore({
          limit: 50,
          skip: 0,
        });

        const data = dataSelector
          ? dataSelector(response)
          : ([] as unknown as TData[]);
        const dataAsStrings: string[] = data as string[];
        const totalRows = dataTotalSelector
          ? dataTotalSelector(response)
          : dataAsStrings.length;

        filtersDataStore.set({
          [columnKey]: {
            ...currentFilterData,
            data: dataAsStrings,
            hasMore: totalRows > dataAsStrings.length,
            isLoading: false,
            totalLoadedRows: dataAsStrings.length,
            totalRows,
          },
        });
      } catch (error) {
        console.error(
          '[useFetchFilterData] Error fetching filter data:',
          error,
        );
        const message =
          error instanceof Error ? error.message : 'Failed to load filter data';
        metaStore.set({
          error: message,
        });

        filtersDataStore.set({
          [columnKey]: {
            ...currentFilterData,
            isLoading: false,
          },
        });
      }
    },
    [columnKey, filtersDataStore, metaStore],
  );
};
