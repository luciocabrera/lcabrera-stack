import {
  pruneCollapsedGroupPaths,
  pruneDrilledGroups,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';

/**
 * Drops every collapsed path the rows just loaded no longer contain, and every
 * drilled page outright.
 *
 * This is the other half of keying expansion by path (ADR-061): a sort change
 * reorders rows without touching any group's key values, so every collapse
 * survives it untouched, while a filter change can remove a group outright —
 * and a path with no group left to hide has to go, or a later filter that
 * brings the group back would re-collapse it from state the user set on data
 * that no longer exists.
 *
 * **Drills take the stricter lifetime and are discarded, not pruned.** A
 * drilled page was fetched under the query the view was read with, so a re-read
 * invalidates every page in hand — including, and especially, those under groups
 * that survived: their heading is unchanged and their count is not, so a kept
 * page looks correct and is not (ADR-079).
 *
 * It writes only when something was actually dropped, which is what stops the
 * effect that calls it from re-entering: both helpers return the same instance
 * when nothing changed.
 */
export const usePruneTableGroupExpansion = <
  TData extends Record<string, unknown>,
>() => {
  const { expansionStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();

  return () => {
    const { collapsedGroupPaths, drilledGroups } = expansionStore.get();
    const nextCollapsed = pruneCollapsedGroupPaths({
      collapsedGroupPaths,
      data: dataStore.get().data,
    });
    const nextDrilled = pruneDrilledGroups(drilledGroups);

    if (
      nextCollapsed !== collapsedGroupPaths ||
      nextDrilled !== drilledGroups
    ) {
      expansionStore.set({
        collapsedGroupPaths: nextCollapsed,
        drilledGroups: nextDrilled,
      });
    }
  };
};
