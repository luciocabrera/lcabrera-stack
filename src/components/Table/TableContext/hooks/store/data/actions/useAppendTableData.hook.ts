import { useTableDataContextValue } from '@/components/Table/TableContext/hooks/useTableDataContextValue.hook';

type AppendTableDataArgs = {
  newData: unknown[];
  totalRows: number;
};

export const useAppendTableData = () => {
  const { dataStore } = useTableDataContextValue();

  return ({ newData, totalRows }: AppendTableDataArgs) => {
    const currentData = dataStore.get()?.data ?? [];
    const combinedData = [...currentData, ...newData];
    const totalLoadedRows = combinedData.length;

    dataStore.set({
      data: combinedData,
      hasMore: totalRows > totalLoadedRows,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows,
      totalRows,
    });
  };
};
