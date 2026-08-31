import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { serializeSortingToURL } from '#ui/utils/urlState/serializeSortingToURL.util';

import { usePersistTableStateAction } from '../../columns/actions/hooks/usePersistTableStateAction.hook';
import { applyGroupingReducer, resolveGroupingColumnsPatch } from './utils';

/**
 * The single write path for the grouping store: hand it a function from the applied
 * configuration to the next one, and it commits, persists and navigates.
 * The drawer stages into `TableDrawerContext`'s grouping draft instead and commits through
 * `useBatchSetTableSettings`, so a whole-list replace has no caller on this side — reorder
 * and remove are drawer affordances and live there.
 */
export const useSetTableGrouping = () => {
  const { columnsStore, groupingStore, metaStore } =
    useTableConfigContextValue();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  return (
    deriveNextGrouping: (current: TableGroupingState) => TableGroupingState,
  ) => {
    const metaState = metaStore.get();
    const result = applyGroupingReducer({
      deriveNextGrouping,
      existingGrouping: groupingStore.get(),
      hasDefaultGrouping: metaState?.hasDefaultGrouping === true,
    });

    if (result.kind !== 'updated') return;

    // Resolved before persisting, because the patch is what says whether the
    // sort survived — and the sort has to be written in the same call.
    const columnsState = columnsStore.get();
    const columnsPatch = resolveGroupingColumnsPatch({
      aggregates: result.grouping.aggregates,
      columnsState,
      groupingKeys: result.grouping.keys,
    });

    // **A pruned sort has to reach the URL, not just the store.** Sorting is a
    // search param, so clearing a grouping while sorted by one of its measure
    // columns leaves the loader reading a column the grid no longer has —
    // `sanitizeSorting` passes it through and the ungrouped read refuses it
    // outright. Writing it beside the grouping entry keeps this one navigation;
    // `pruneSortingToColumns` returns the same array when it removed nothing,
    // so an ordinary grouping change still writes exactly one param.
    const entries =
      columnsPatch.sorting === columnsState.sorting
        ? [result.persistenceEntry]
        : [
            result.persistenceEntry,
            {
              searchParamKey: 'sorting',
              searchParamValue: serializeSortingToURL(columnsPatch.sorting),
            },
          ];

    // Abort before any state change when persistence would be oversized, so the
    // store never holds grouping the URL failed to record.
    if (!persistTableState(entries)) return;

    dataStore.set({ isLoading: true });
    // The columns store carries the derived view state, and the measure columns
    // are part of it while grouping is on (ADR-065, #869) — so a grouping
    // change writes both stores, in the same interaction, from one snapshot
    // each.
    columnsStore.set(columnsPatch);
    groupingStore.set(result.grouping);

    // An open drawer holds a draft snapshotted at mount, so a live grouping
    // change from the header menu leaves it showing keys and measures that no
    // longer exist. Bumping the nonce re-keys `TableDrawerProvider` and
    // re-seeds every draft, which is what sorting, pinning and visibility
    // already do from the same menu.
    metaStore.set({
      drawersSyncNonce: (metaState?.drawersSyncNonce ?? 0) + 1,
    });
  };
};
