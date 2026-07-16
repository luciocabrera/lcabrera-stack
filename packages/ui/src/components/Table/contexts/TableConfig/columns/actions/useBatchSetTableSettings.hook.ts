import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@repo/ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import {
  getHasQueryChanged,
  persistTableMetaUiState,
} from '@repo/ui/components/Table/utils';

import type { BatchTableSettingsUpdate } from './utils/resolveBatchTableSettingsUpdate.util';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
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
    const hasQueryChanged = getHasQueryChanged<TData>({
      columnsState,
      nextColumnFilters: settings.columnFilters,
      nextSorting: settings.sorting,
    });
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

    if (hasQueryChanged) {
      dataStore.set({
        isLoading: true,
      });
    }

    columnsStore.set(resolvedUpdate);
    if (!metaState?.isTableSettingsPinned) {
      const nextStatePatch = { isTableSettingsOpen: false };

      persistTableMetaUiState({
        currentState: metaState,
        nextStatePatch,
      });
      metaStore.set(nextStatePatch);
    }
  };
};
