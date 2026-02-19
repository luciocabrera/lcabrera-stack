import type { InfiniteScroll } from '@/types/ui.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '../useFiltersDataContextValue.hook';

type FetchMoreFilterDataArgs<TData, TResponse> = Omit<
  InfiniteScroll<TData, TResponse>,
  'hasMore' | 'isLoadingMore'
>;

export const useFetchMoreFilterData = <TData, TResponse>(columnKey: string) => {
  const { filtersDataStore } = useTableDataContextValue();
  const { metaStore } = useTableConfigContextValue<TData>();

  return async ({
    dataSelector,
    dataTotalSelector,
    onLoadMore,
  }: FetchMoreFilterDataArgs<TData, TResponse>) => {
    const filtersDataState = filtersDataStore.get();
    const currentFilterData = filtersDataState?.[columnKey];
    const currentData = currentFilterData?.data ?? [];

    if (!onLoadMore) {
      throw new Error('onLoadMore callback is required');
    }

    if (!currentFilterData) {
      throw new Error(`Filter data not initialized for column: ${columnKey}`);
    }

    try {
      filtersDataStore.set({
        [columnKey]: { 
          ...currentFilterData, 
          isLoadingMore: true 
        },
      });
      const response = await onLoadMore({
        limit: 50,
        skip: currentData.length,
      });
      const data = dataSelector
        ? dataSelector(response)
        : ([] as unknown as TData[]);
      const combinedData: string[] = [...currentData, ...data] as string[];
      const totalLoadedRows = combinedData.length;
      const totalRows = dataTotalSelector
        ? dataTotalSelector(response)
        : (currentFilterData.totalRows ?? totalLoadedRows);

      filtersDataStore.set({
        [columnKey]: {
          ...currentFilterData,
          data: combinedData,
          hasMore: totalRows > totalLoadedRows,
          isLoading: false,
          isLoadingMore: false,
          totalLoadedRows,
          totalRows,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load more data';
      metaStore.set({
        error: message,
      });

      filtersDataStore.set({
        [columnKey]: { 
          ...currentFilterData, 
          isLoadingMore: false 
        },
      });
    }
  };
};
