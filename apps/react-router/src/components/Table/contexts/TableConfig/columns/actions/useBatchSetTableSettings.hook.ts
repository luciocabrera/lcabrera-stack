import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';

import {
  buildPersistencePayload,
  resolveBatchTableSettingsUpdate,
} from './utils';
import type { BatchTableSettingsUpdate } from './utils/resolveBatchTableSettingsUpdate.util';

export const useBatchSetTableSettings = <TData = Record<string, unknown>>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  return (settings: BatchTableSettingsUpdate<TData>) => {
    dataStore.set({
      isLoadingMore: true,
    });
    const columnsState = columnsStore.get();
    const persistenceKey = metaStore.get()?.persistenceKey ?? '';
    const resolvedUpdate = resolveBatchTableSettingsUpdate<TData>({
      columns: columnsState?.columns ?? [],
      settings,
    });

    persistTableState(
      buildPersistencePayload<TData>({
        columnFilters: settings.columnFilters,
        columnOrder: settings.columnOrder,
        columnPinning: settings.columnPinning,
        columnSizing: settings.columnSizing,
        columnVisibility: settings.columnVisibility,
        persistenceKey,
        sorting: settings.sorting,
      }),
    );

    columnsStore.set(resolvedUpdate);
    metaStore.set({ isTableSettingsOpen: false });
    dataStore.set({
      isLoadingMore: false,
    });
  };
};
