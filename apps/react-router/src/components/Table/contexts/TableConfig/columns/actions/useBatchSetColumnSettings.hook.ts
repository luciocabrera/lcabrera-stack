import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { usePersistTableStateAction } from '@/components/Table/hooks';

import {
  buildPersistencePayload,
  resolveBatchColumnSettingsUpdate,
} from './utils';
import type { BatchColumnSettingsUpdate } from './utils/resolveBatchColumnSettingsUpdate.util';

export const useBatchSetColumnSettings = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const persistTableState = usePersistTableStateAction();

  return (settings: BatchColumnSettingsUpdate<TData>) => {
    dataStore.set({
      isLoading: true,
    });

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

    persistTableState(
      buildPersistencePayload<TData>({
        columnFilters: resolvedUpdate.columnFilters,
        columnOrder: resolvedUpdate.columnOrder,
        columnPinning: resolvedUpdate.columnPinning,
        columnSizing: resolvedUpdate.columnSizing,
        persistenceKey,
        sorting: resolvedUpdate.sorting,
      }),
    );

    columnsStore.set(resolvedUpdate);

    if (isColumnSettingsPinned) {
      metaStore.set({
        isColumnSettingsOpen: true,
      });
      return;
    }

    metaStore.set({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: shouldRestoreTableSettings
        ? true
        : (metaState?.isTableSettingsOpen ?? false),
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
  };
};
