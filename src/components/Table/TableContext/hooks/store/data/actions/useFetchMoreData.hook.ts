import type { PaginationState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/TableContext/hooks/useTableDataContextValue.hook';

type AppendTableDataArgs<TData extends Record<string, unknown>, TResponse> = {
  dataSelector?: (response: TResponse) => TData[];
  dataTotalSelector?: (response: TResponse) => number;
  onLoadMore: (params: PaginationState) => Promise<TResponse>;
};

export const useFetchMoreData = <
  TData extends Record<string, unknown>,
  TResponse,
>() => {
  const { dataStore } = useTableDataContextValue();
  const { metaStore } = useTableConfigContextValue();
  const dataState = dataStore.get();

  return async ({
    dataSelector,
    dataTotalSelector,
    onLoadMore,
  }: AppendTableDataArgs<TData, TResponse>) => {
    const currentData = dataState?.data ?? [];

    try {
      dataStore.set({
        isLoadingMore: true,
      });
      const response = await onLoadMore({
        limit: 50,
        skip: currentData.length,
      });
      const data = dataSelector
        ? dataSelector(response)
        : ([] as unknown as TData[]);
      const combinedData = [...currentData, ...data];
      const totalLoadedRows = combinedData.length;
      const totalRows = dataTotalSelector
        ? dataTotalSelector(response)
        : (dataState?.totalRows ?? totalLoadedRows);

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
