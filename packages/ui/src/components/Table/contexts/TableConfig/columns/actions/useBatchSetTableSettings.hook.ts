import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { resolveTableGroupingUpdate } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';
import { usePersistTableUiFlagsAction } from '#ui/components/Table/contexts/TableConfig/meta/actions/usePersistTableUiFlagsAction.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { getHasQueryChanged } from '#ui/components/Table/utils';

import type { BatchTableSettingsUpdate } from './utils/resolveBatchTableSettingsUpdate.util';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
import {
  buildPersistencePayload,
  resolveBatchTableSettingsUpdate,
} from './utils';

type BatchSetTableSettingsArgs<TData> = {
  /** The whole grouping configuration to apply — staged, or unchanged. */
  readonly grouping: TableGroupingState;
  readonly settings: BatchTableSettingsUpdate<TData>;
};

/**
 * The drawer's Accept: every staged setting committed in one write.
 *
 * Grouping travels with the column state instead of taking its own commit
 * path because both persist through the same `persist-table-state` fetcher,
 * and `router.fetch` aborts a key's in-flight request before starting the next
 * — so a second call would cancel the first commit and still cost a second
 * navigation for whichever half survived. One `persistTableState` call
 * carrying every entry is what makes Accept exactly one navigation, however
 * many edits were staged.
 *
 * Grouping is resolved rather than written blind: `resolveTableGroupingUpdate`
 * answers `unchanged` when the staged configuration is the applied one, which
 * is what keeps an Accept that touched no grouping from adding a `grouping`
 * param write to the batch.
 */
export const useBatchSetTableSettings = <TData = Record<string, unknown>>() => {
  const { columnsStore, groupingStore, metaStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return ({ grouping, settings }: BatchSetTableSettingsArgs<TData>) => {
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
    const groupingUpdate = resolveTableGroupingUpdate({
      existingGrouping: groupingStore.get(),
      nextGrouping: grouping,
    });
    const persistenceEntries = buildPersistencePayload<TData>({
      columnFilters: settings.columnFilters,
      columnOrder: settings.columnOrder,
      columnPinning: settings.columnPinning,
      columnSizing: settings.columnSizing,
      columnVisibility: settings.columnVisibility,
      persistenceKey,
      sorting: settings.sorting,
    });

    if (
      !persistTableState(
        groupingUpdate.kind === 'updated'
          ? [...persistenceEntries, groupingUpdate.persistenceEntry]
          : persistenceEntries,
      )
    ) {
      return;
    }

    if (hasQueryChanged || groupingUpdate.kind === 'updated') {
      dataStore.set({
        isLoading: true,
      });
    }

    columnsStore.set(resolvedUpdate);
    if (groupingUpdate.kind === 'updated') {
      groupingStore.set(groupingUpdate.grouping);
    }
    if (!metaState?.isTableSettingsPinned) {
      const nextStatePatch = { isTableSettingsOpen: false };

      persistUiFlags({
        currentState: metaState,
        nextStatePatch,
      });
      metaStore.set(nextStatePatch);
    }
  };
};
