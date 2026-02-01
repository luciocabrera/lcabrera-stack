import { useTableDataContextValue } from '@/components/Table/TableContext/hooks/useTableDataContextValue.hook';

export const useSetTableDataLoadingMore = () => {
  const { dataStore } = useTableDataContextValue();

  return (isLoadingMore: boolean) => {
    dataStore.set({ isLoadingMore });
  };
};
