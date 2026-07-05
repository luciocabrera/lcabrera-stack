import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { writeStateSlice } from '@repo/ui/components/Table/utils';

export const useSyncColumnsSizing = () => {
  const { columnsStore, metaStore } = useTableConfigContextValue();

  return () => {
    const columnsSizing = columnsStore.get()?.columnSizing;
    const metaState = metaStore.get();
    const appId = metaState?.appId;
    const persistenceKey = metaState?.persistenceKey;
    if (columnsSizing && persistenceKey) {
      writeStateSlice({
        appId,
        persistenceKey,
        slice: 'columnSizing',
        storageType: 'cookie',
        value: columnsSizing,
      });
    }
  };
};
