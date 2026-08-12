import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';

import { usePersistTableStateAction } from '../../columns/actions/hooks/usePersistTableStateAction.hook';
import { resolveTableGroupingUpdate } from './utils';

/**
 * Apply a group key, or clear grouping when called with `undefined`.
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

  return (columnKey: string | undefined) => {
    const groupingState = groupingStore.get();
    const result = resolveTableGroupingUpdate({
      columnKey,
      existingKeys: groupingState?.keys ?? [],
    });

    if (result.kind !== 'updated') return;

    // Abort before any state change when persistence would be oversized, so the
    // store never holds grouping the URL failed to record.
    if (!persistTableState(result.persistenceEntry)) return;

    dataStore.set({ isLoading: true });
    groupingStore.set({ keys: result.keys });
  };
};
