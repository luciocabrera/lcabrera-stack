import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { serializeSortingToURL } from '#ui/utils/urlState/serializeSortingToURL.util';

import { usePersistTableStateAction } from '../../columns/actions/hooks/usePersistTableStateAction.hook';
import { applyGroupingReducer, resolveGroupingColumnsPatch } from './utils';

/**
 * The single write path for the grouping store: hand it a function from the
 * applied configuration to the next one, and it commits, persists and
 * navigates.
 *
 * Its surface is the **column-header menu**, which acts immediately because it
 * has no Accept to wait for. The drawer stages into `TableDrawerContext`'s
 * grouping draft instead and commits through `useBatchSetTableSettings`, so a
 * whole-list replace has no caller on this side — reorder and remove are
 * drawer affordances and live there.
 *
 * Internal to `actions/` — the named actions beside it
 * (`useToggleTableGroupKey`, `useSetTableColumnAggregate`,
 * `useClearTableGrouping`) are what surfaces call. Keeping this one out of the
 * barrel is what stops a component computing grouping state for itself, which
 * is the store-pattern rule that components consume actions rather than state
 * transitions.
 *
 * It takes a **reducer** rather than a finished state so the store is read
 * exactly once per interaction. A finished state would need the caller to read
 * the store too, and two reads of one store in a single action path can
 * straddle a concurrent update. `applyGroupingReducer` holds that shape, shared
 * with the drawer's draft write path so the two cannot come to resolve a change
 * differently.
 *
 * Grouping changes the SQL the route emits, so this writes the `grouping`
 * search param through the persist-cookie flow and lets the resulting redirect
 * re-run the loader (ADR-061) — the same path sorting takes, and the reason no
 * second `shouldRevalidate` exists.
 *
 * Exactly one navigation per interaction follows from where the effects sit: an
 * event handler calls this once, `resolveTableGroupingUpdate` answers
 * `unchanged` for a repeat of the applied state, and nothing here runs on
 * render. There is no `useEffect` in this path and there must not be one — a
 * store write that re-derived the URL during render would fire a navigation per
 * render instead.
 */
export const useSetTableGrouping = () => {
  const { columnsStore, groupingStore, metaStore } =
    useTableConfigContextValue();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  return (
    deriveNextGrouping: (current: TableGroupingState) => TableGroupingState,
  ) => {
    const result = applyGroupingReducer({
      deriveNextGrouping,
      existingGrouping: groupingStore.get(),
      hasDefaultGrouping: metaStore.get()?.hasDefaultGrouping === true,
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
  };
};
