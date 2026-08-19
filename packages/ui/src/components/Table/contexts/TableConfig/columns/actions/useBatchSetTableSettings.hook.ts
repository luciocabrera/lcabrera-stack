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
  /** The whole grouping configuration to apply — staged, or unchanged. */
  readonly grouping: TableGroupingState;
  readonly settings: BatchTableSettingsUpdate<TData>;
  /** Where totals go — staged, or unchanged. */
  readonly totalsPlacement: TableTotalsPlacement;
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

  return ({
    grouping,
    settings,
    totalsPlacement,
  }: BatchSetTableSettingsArgs<TData>) => {
    const columnsState = columnsStore.get();
    const metaState = metaStore.get();
    const persistenceKey = metaState?.persistenceKey ?? '';
    const hasQueryChanged = getHasQueryChanged<TData>({
      columnsState,
      nextColumnFilters: settings.columnFilters,
      nextSorting: settings.sorting,
    });
    const groupingUpdate = resolveTableGroupingUpdate({
      existingGrouping: groupingStore.get(),
      hasDefaultGrouping: metaState?.hasDefaultGrouping === true,
      nextGrouping: grouping,
    });
    // Resolved before the column state, and derived from the grouping this
    // Accept is about to apply rather than the applied one: the hierarchy
    // column belongs to the configuration being committed, so deriving from
    // the old keys would leave it a render behind the grouping it renders.
    const resolvedUpdate = resolveBatchTableSettingsUpdate<TData>({
      columns: columnsState?.columns ?? [],
      groupingKeys:
        groupingUpdate.kind === 'updated'
          ? groupingUpdate.grouping.keys
          : grouping.keys,
      settings,
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

    // Absent reads as `last` on every other side of this, so comparing against
    // the raw value would report a change the query cannot tell apart.
    const hasPlacementChanged =
      totalsPlacement !== (metaState?.totalsPlacement ?? 'last');

    if (
      !persistTableState([
        ...persistenceEntries,
        ...(groupingUpdate.kind === 'updated'
          ? [groupingUpdate.persistenceEntry]
          : []),
        // Param-only, and deliberately not a cookie write of its own: the
        // UI-flags cookie is rewritten whole below, so a second entry writing
        // the same key on a different fetcher would be overwritten by whichever
        // landed last (#578).
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

    // All three are pure reads, so the order is free; the two plain booleans
    // lead because the comparison is the only one that has to be evaluated.
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

    // One UI-flags write carrying both changes. They share a cookie whose value
    // is serialized whole from the meta state, so writing them separately would
    // have the second overwrite the first with a snapshot taken before it.
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
