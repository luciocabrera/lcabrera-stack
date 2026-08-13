import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';

import { usePersistTableStateAction } from '../../columns/actions/hooks/usePersistTableStateAction.hook';
import { applyGroupingReducer } from './utils';

/**
 * The single write path for the grouping store: hand it a function from the
 * applied configuration to the next one, and it commits, persists and
 * navigates.
 *
 * Internal to `actions/` — the named actions beside it
 * (`useToggleTableGroupKey`, `useSetTableGroupKeys`,
 * `useSetTableColumnAggregate`, `useClearTableGrouping`) are what surfaces
 * call. Keeping this one out of the barrel is what stops a component computing
 * grouping state for itself, which is the store-pattern rule that components
 * consume actions rather than state transitions.
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
  const { groupingStore } = useTableConfigContextValue();
  const { dataStore } = useTableDataContextValue();
  const persistTableState = usePersistTableStateAction();

  return (
    deriveNextGrouping: (current: TableGroupingState) => TableGroupingState,
  ) => {
    const result = applyGroupingReducer({
      deriveNextGrouping,
      existingGrouping: groupingStore.get(),
    });

    if (result.kind !== 'updated') return;

    // Abort before any state change when persistence would be oversized, so the
    // store never holds grouping the URL failed to record.
    if (!persistTableState(result.persistenceEntry)) return;

    dataStore.set({ isLoading: true });
    groupingStore.set(result.grouping);
  };
};
