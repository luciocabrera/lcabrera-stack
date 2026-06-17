import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';

import type { BatchTableSettingsUpdate } from './utils/resolveBatchTableSettingsUpdate.util';

import {
  buildPersistencePayload,
  resolveBatchTableSettingsUpdate,
} from './utils';

export const useBatchSetTableSettings = <TData = Record<string, unknown>>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  return (settings: BatchTableSettingsUpdate<TData>) => {
    const columnsState = columnsStore.get();
    const metaState = metaStore.get();
    const persistenceKey = metaState?.persistenceKey ?? '';
    const resolvedUpdate = resolveBatchTableSettingsUpdate<TData>({
      columns: columnsState?.columns ?? [],
      settings,
    });

    if (
      !persistTableState(
        buildPersistencePayload<TData>({
          columnFilters: settings.columnFilters,
          columnOrder: settings.columnOrder,
          columnPinning: settings.columnPinning,
          columnSizing: settings.columnSizing,
          columnVisibility: settings.columnVisibility,
          persistenceKey,
          sorting: settings.sorting,
        }),
      )
    ) {
      return;
    }

    dataStore.set({
      isLoading: true,
    });

    columnsStore.set(resolvedUpdate);
    if (!metaState?.isTableSettingsPinned) {
      metaStore.set({ isTableSettingsOpen: false });
    }
  };
};
