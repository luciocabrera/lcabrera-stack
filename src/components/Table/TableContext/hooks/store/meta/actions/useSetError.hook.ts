import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/TableContext/hooks/useTableDataContextValue.hook';

export const useSetError = () => {
  const { metaStore } = useTableConfigContextValue();
  const { dataStore } = useTableDataContextValue();

  return (error: string | undefined) => {
    metaStore.set({ error });
    dataStore.set({ isLoading: false, isLoadingMore: false });
  };
};
