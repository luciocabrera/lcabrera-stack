import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';
import { persistTableMetaUiState } from '@/components/Table/utils';
import { areEqualByJson } from '@/utils/comparison';

import type { BatchColumnSettingsUpdate } from './utils/resolveBatchColumnSettingsUpdate.util';

import {
  buildPersistencePayload,
  resolveBatchColumnSettingsUpdate,
} from './utils';

export const useBatchSetColumnSettings = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return (settings: BatchColumnSettingsUpdate<TData>) => {
    const columnsState = columnsStore.get();
    const metaState = metaStore.get();
    const isColumnSettingsPinned = metaState?.isColumnSettingsPinned ?? false;
    const persistenceKey = metaState?.persistenceKey ?? '';
    const shouldRestoreTableSettings =
      metaState?.wasTableSettingsOpenBeforeColumnSettings ?? false;
    const resolvedUpdate = resolveBatchColumnSettingsUpdate<TData>({
      columnsState,
      settings,
    });

    // Check if query-affecting changes (filters/sorting) have changed
    const hasSortingChanged = !areEqualByJson({
      left: columnsState?.sorting,
      right: resolvedUpdate.sorting,
    });
    const hasFiltersChanged = !areEqualByJson({
      left: columnsState?.columnFilters,
      right: resolvedUpdate.columnFilters,
    });
    const hasQueryChanged = hasSortingChanged || hasFiltersChanged;

    const didPersist = persistTableState(
      buildPersistencePayload<TData>({
        columnFilters: resolvedUpdate.columnFilters,
        columnOrder: resolvedUpdate.columnOrder,
        columnPinning: resolvedUpdate.columnPinning,
        columnSizing: resolvedUpdate.columnSizing,
        persistenceKey,
        sorting: resolvedUpdate.sorting,
      }),
    );

    if (!didPersist) return;

    // Only trigger data fetch if query-affecting changes occurred
    if (hasQueryChanged) {
      dataStore.set({
        isLoading: true,
      });
    }

    columnsStore.set(resolvedUpdate);

    const isTableSettingsOpen = shouldRestoreTableSettings
      ? true
      : (metaState?.isTableSettingsOpen ?? false);

    const nextStatePatch = isColumnSettingsPinned
      ? {
          isColumnSettingsOpen: true,
        }
      : {
          isColumnSettingsOpen: false,
          isTableSettingsOpen,
          wasTableSettingsOpenBeforeColumnSettings: false,
        };

    persistTableMetaUiState({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
