import { useTableDataContextValue } from '@/components/Table/TableContext/hooks/useTableDataContextValue.hook';

type SetTableDataArgs = {
  data: unknown[];
  totalRows?: number;
};

export const useSetTableData = () => {
  const { dataStore } = useTableDataContextValue();

  return ({ data, totalRows }: SetTableDataArgs) => {
    dataStore.set({
      data,
      hasMore: (totalRows ?? data.length) > data.length,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows: data.length,
      totalRows: totalRows ?? data.length,
    });
  };
};
