import { useTableDataContextValue } from '@/components/Table/TableContext/hooks/useTableDataContextValue.hook';

export const useSetTableDataLoading = () => {
  const { dataStore } = useTableDataContextValue();

  return (isLoading: boolean) => {
    dataStore.set({ isLoading });
  };
};
