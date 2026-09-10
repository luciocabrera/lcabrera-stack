import type {
  TableGroupingState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { resolveTableGroupingUpdate } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';
import { usePersistTableUiFlagsAction } from '#ui/components/Table/contexts/TableConfig/meta/actions/usePersistTableUiFlagsAction.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { getHasQueryChanged } from '#ui/components/Table/utils';
import { toColumnAxisDerivationArgs } from '#ui/components/Table/utils/toColumnAxisDerivationArgs.util';

import type { BatchTableSettingsUpdate } from './utils/resolveBatchTableSettingsUpdate.util';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
import {
  appendQueryPersistenceEntries,
  buildPersistencePayload,
  resolveBatchTableSettingsUpdate,
  resolveCommittedGroupingState,
} from './utils';

type BatchSetTableSettingsArgs<TData> = {
  readonly grouping: TableGroupingState;
  readonly settings: BatchTableSettingsUpdate<TData>;
  readonly totalsPlacement: TableTotalsPlacement;
};

export const useBatchSetTableSettings = <TData = Record<string, unknown>>() => {
  const { columnsStore, groupingStore, metaStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();
  const persistUiFlags = usePersistTableUiFlagsAction();

  return ({
    grouping,
    settings,
    totalsPlacement,
  }: BatchSetTableSettingsArgs<TData>) => {
    const columnsState = columnsStore.get();
    const metaState = metaStore.get();
    const currentGrouping = groupingStore.get();
    const groupingUpdate = resolveTableGroupingUpdate({
      existingGrouping: currentGrouping,
      hasDefaultGrouping: metaState?.hasDefaultGrouping === true,
      nextGrouping: grouping,
    });
    const nextGrouping =
      groupingUpdate.kind === 'updated' ? groupingUpdate.grouping : grouping;
    const resolvedUpdate = resolveBatchTableSettingsUpdate<TData>({
      aggregates: nextGrouping.aggregates,
      columns: columnsState?.columns ?? [],
      groupingKeys: nextGrouping.keys,
      settings,
      ...toColumnAxisDerivationArgs({
        columnAxis: nextGrouping.columnAxis,
        data: dataStore.get().data,
      }),
    });
    const hasQueryChanged = getHasQueryChanged<TData>({
      columnsState,
      nextColumnFilters: settings.columnFilters,
      nextSorting: resolvedUpdate.sorting,
    });
    const hasPlacementChanged =
      totalsPlacement !== (currentGrouping?.totalsPlacement ?? 'last');
    const hasLiveQueryChanged =
      hasPlacementChanged ||
      hasQueryChanged ||
      groupingUpdate.kind === 'updated';

    if (
      !persistTableState(
        appendQueryPersistenceEntries({
          columnEntries: buildPersistencePayload<TData>({
            columnFilters: settings.columnFilters,
            columnOrder: settings.columnOrder,
            columnPinning: settings.columnPinning,
            columnSizing: settings.columnSizing,
            columnVisibility: settings.columnVisibility,
            persistenceKey: metaState?.persistenceKey ?? '',
            sorting: resolvedUpdate.sorting,
          }),
          groupingUpdate,
          hasPlacementChanged,
          totalsPlacement,
        }),
      )
    ) {
      return;
    }

    if (hasLiveQueryChanged) {
      dataStore.set({ isLoading: true });
    }

    columnsStore.set(resolvedUpdate);
    if (hasPlacementChanged || groupingUpdate.kind === 'updated') {
      groupingStore.set(
        resolveCommittedGroupingState({
          currentGrouping,
          groupingUpdate,
          totalsPlacement,
        }),
      );
    }

    const nextStatePatch = {
      ...(metaState?.isTableSettingsPinned !== true && {
        isTableSettingsOpen: false,
      }),
    };

    if (hasPlacementChanged || Object.keys(nextStatePatch).length > 0) {
      persistUiFlags({
        currentState: metaState,
        nextStatePatch,
        totalsPlacement,
      });
    }

    if (Object.keys(nextStatePatch).length > 0) {
      metaStore.set(nextStatePatch);
    }
  };
};
