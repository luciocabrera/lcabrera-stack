import type {
  TableColumnsState,
  TableGroupingState,
  TableMetaState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { resolveTableGroupingUpdate } from '#ui/components/Table/contexts/TableConfig/grouping/actions/utils';
import { getHasQueryChanged } from '#ui/components/Table/utils';
import { toColumnAxisDerivationArgs } from '#ui/components/Table/utils/toColumnAxisDerivationArgs.util';

import type { BatchTableSettingsUpdate } from './resolveBatchTableSettingsUpdate.util';

import { appendQueryPersistenceEntries } from './appendQueryPersistenceEntries.util';
import { buildPersistencePayload } from './buildPersistencePayload.util';
import { resolveBatchSettingsWrite } from './resolveBatchSettingsWrite.util';
import { resolveBatchTableSettingsUpdate } from './resolveBatchTableSettingsUpdate.util';

type ResolveBatchSettingsPlanArgs<TData> = {
  readonly columnsState: Partial<TableColumnsState<TData>> | undefined;
  readonly currentGrouping: TableGroupingState;
  readonly data: readonly unknown[];
  readonly grouping: TableGroupingState;
  readonly metaState: Partial<TableMetaState> | undefined;
  readonly settings: BatchTableSettingsUpdate<TData>;
  readonly totalsPlacement: TableTotalsPlacement;
};

export const resolveBatchSettingsPlan = <TData>({
  columnsState,
  currentGrouping,
  data,
  grouping,
  metaState,
  settings,
  totalsPlacement,
}: ResolveBatchSettingsPlanArgs<TData>) => {
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
      data,
    }),
  });
  const hasQueryChanged = getHasQueryChanged<TData>({
    columnsState,
    nextColumnFilters: settings.columnFilters,
    nextSorting: resolvedUpdate.sorting,
  });
  const hasPlacementChanged =
    totalsPlacement !== (currentGrouping.totalsPlacement ?? 'last');
  const hasLiveQueryChanged =
    hasPlacementChanged || hasQueryChanged || groupingUpdate.kind === 'updated';
  const stateEntries = appendQueryPersistenceEntries({
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
  });
  return {
    hasLiveQueryChanged,
    resolvedUpdate,
    ...resolveBatchSettingsWrite({
      currentGrouping,
      groupingUpdate,
      hasLiveQueryChanged,
      hasPlacementChanged,
      metaState,
      stateEntries,
      totalsPlacement,
    }),
  };
};
