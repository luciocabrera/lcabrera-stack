import type {
  InfiniteScrollResponse,
  PaginationState,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/TableContext/hooks/useTableDataContextValue.hook';

type AppendTableDataArgs<TData> = {
  onLoadMore: (
    params: PaginationState,
  ) => Promise<InfiniteScrollResponse<TData>>;
};

export const useFetchMoreData = <TData>() => {
  const { dataStore } = useTableDataContextValue();
  const { metaStore } = useTableConfigContextValue();
  const dataState = dataStore.get();

  return async ({ onLoadMore }: AppendTableDataArgs<TData>) => {
    const currentData = dataState?.data ?? [];
    const currentTotalRows = dataState?.totalRows ?? currentData.length;

    try {
      dataStore.set({
        isLoadingMore: true,
      });
      const result = await onLoadMore({
        limit: 50,
        skip: currentData.length,
      });
      const combinedData = [...currentData, ...result.data];
      const totalLoadedRows = combinedData.length;
      const totalRows = result.total ?? currentTotalRows;
      dataStore.set({
        data: combinedData,
        hasMore: totalRows > totalLoadedRows,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows,
        totalRows,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load more data';
      metaStore.set({
        error: message,
      });

      dataStore.set({
        isLoadingMore: false,
      });
    }
  };
};
