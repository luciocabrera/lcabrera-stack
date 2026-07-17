import { usePersistTableUiFlagsAction } from '@repo/ui/components/Table/contexts/TableConfig/meta/actions/usePersistTableUiFlagsAction.hook';
import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '@repo/ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import {
  getColumnSettingsNextStatePatch,
  getHasQueryChanged,
} from '@repo/ui/components/Table/utils';

import type { BatchColumnSettingsUpdate } from './utils/resolveBatchColumnSettingsUpdate.util';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
import {
  buildPersistencePayload,
  resolveBatchColumnSettingsUpdate,
} from './utils';

export const useBatchSetColumnSettings = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const persistTableState = usePersistTableStateAction();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return (settings: BatchColumnSettingsUpdate<TData>) => {
    const columnsState = columnsStore.get();
    const metaState = metaStore.get();
    const persistenceKey = metaState?.persistenceKey ?? '';
    const resolvedUpdate = resolveBatchColumnSettingsUpdate<TData>({
      columnsState,
      settings,
    });
    const hasQueryChanged = getHasQueryChanged<TData>({
      columnsState,
      nextColumnFilters: resolvedUpdate.columnFilters,
      nextSorting: resolvedUpdate.sorting,
    });

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
    const nextStatePatch = getColumnSettingsNextStatePatch({ metaState });

    persistUiFlags({
      currentState: metaState,
      nextStatePatch,
    });
    metaStore.set(nextStatePatch);
  };
};
