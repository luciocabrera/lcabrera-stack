import { pruneCollapsedGroupPaths } from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';

/**
 * Drops every collapsed path the rows just loaded no longer contain.
 *
 * This is the other half of keying expansion by path (ADR-061): a sort change
 * reorders rows without touching any group's key values, so every collapse
 * survives it untouched, while a filter change can remove a group outright —
 * and a path with no group left to hide has to go, or a later filter that
 * brings the group back would re-collapse it from state the user set on data
 * that no longer exists.
 *
 * It writes only when something was actually dropped, which is what stops the
 * effect that calls it from re-entering: the helper returns the same instance
 * when nothing changed.
 */
export const usePruneTableGroupExpansion = <
  TData extends Record<string, unknown>,
>() => {
  const { expansionStore } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();

  return () => {
    const { collapsedGroupPaths } = expansionStore.get();
    const nextCollapsed = pruneCollapsedGroupPaths({
      collapsedGroupPaths,
      data: dataStore.get().data,
    });

    if (nextCollapsed !== collapsedGroupPaths) {
      expansionStore.set({ collapsedGroupPaths: nextCollapsed });
    }
  };
};
