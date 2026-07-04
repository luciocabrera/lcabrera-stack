import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { writeStateSlice } from '@repo/ui/components/Table/utils';

export const useSyncColumnsSizing = () => {
  const { columnsStore, metaStore } = useTableConfigContextValue();

  return () => {
    const columnsSizing = columnsStore.get()?.columnSizing;
    const persistenceKey = metaStore.get()?.persistenceKey;
    if (columnsSizing && persistenceKey) {
      writeStateSlice({
        persistenceKey,
        slice: 'columnSizing',
        storageType: 'cookie',
        value: columnsSizing,
      });
    }
  };
};
