import type {
  TableGroupingState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { resolveTableGroupingUpdate } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';
import { usePersistTableUiFlagsAction } from '#ui/components/Table/contexts/TableConfig/meta/actions/usePersistTableUiFlagsAction.hook';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { TABLE_TOTALS_PLACEMENT_PARAM } from '#ui/components/Table/Table.constants';
import { getHasQueryChanged } from '#ui/components/Table/utils';

import type { BatchTableSettingsUpdate } from './utils/resolveBatchTableSettingsUpdate.util';

import { usePersistTableStateAction } from './hooks/usePersistTableStateAction.hook';
import {
  buildPersistencePayload,
  resolveBatchTableSettingsUpdate,
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
    const persistenceKey = metaState?.persistenceKey ?? '';
    const groupingUpdate = resolveTableGroupingUpdate({
      existingGrouping: groupingStore.get(),
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
    });
    const persistenceEntries = buildPersistencePayload<TData>({
      columnFilters: settings.columnFilters,
      columnOrder: settings.columnOrder,
      columnPinning: settings.columnPinning,
      columnSizing: settings.columnSizing,
      columnVisibility: settings.columnVisibility,
      persistenceKey,
      sorting: resolvedUpdate.sorting,
    });
    const hasQueryChanged = getHasQueryChanged<TData>({
      columnsState,
      nextColumnFilters: settings.columnFilters,
      nextSorting: resolvedUpdate.sorting,
    });

    const hasPlacementChanged =
      totalsPlacement !== (metaState?.totalsPlacement ?? 'last');

    if (
      !persistTableState([
        ...persistenceEntries,
        ...(groupingUpdate.kind === 'updated'
          ? [groupingUpdate.persistenceEntry]
          : []),
        ...(hasPlacementChanged
          ? [
              {
                searchParamKey: TABLE_TOTALS_PLACEMENT_PARAM,
                searchParamValue: totalsPlacement,
              },
            ]
          : []),
      ])
    ) {
      return;
    }

    if (
      hasQueryChanged ||
      hasPlacementChanged ||
      groupingUpdate.kind === 'updated'
    ) {
      dataStore.set({
        isLoading: true,
      });
    }

    columnsStore.set(resolvedUpdate);
    if (groupingUpdate.kind === 'updated') {
      groupingStore.set(groupingUpdate.grouping);
    }

    const nextStatePatch = {
      ...(hasPlacementChanged && { totalsPlacement }),
      ...(metaState?.isTableSettingsPinned !== true && {
        isTableSettingsOpen: false,
      }),
    };

    if (Object.keys(nextStatePatch).length > 0) {
      persistUiFlags({
        currentState: metaState,
        nextStatePatch,
      });
      metaStore.set(nextStatePatch);
    }
  };
};
