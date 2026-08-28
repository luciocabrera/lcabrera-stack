import {
  areAllGroupsCollapsed,
  resolveTableGroupTree,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';

import { applyGroupFoldFocus, resolveOutermostGroupPathKey } from './utils';

/** Expansion is the complement of the collapsed set (ADR-067), so "everything open" is empty. */
const NOTHING_COLLAPSED: ReadonlySet<string> = new Set<string>();

/**
 * Local, like the per-row toggle it generalises: expansion changes nothing server-side, so
 * this touches no URL param and triggers no revalidation (ADR-061).
 * **What it collapses is the tree's own foldable set**, not a second enumeration of it:
 * the same `foldableGroupPaths` every chevron is drawn from, so "collapse all" cannot
 * close a group the grid never offered to close, and cannot leave one open that it did.
 */
export const useSetAllTableGroupsExpanded = <
  TData extends Record<string, unknown>,
>() => {
  const { columnsStore, expansionStore, metaStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const { focusStore } = useTableFocusContextValue();
  const containerRef = useTableContainerRef();

  return (isExpanded: boolean) => {
    const { collapsedGroupPaths } = expansionStore.get();

    if (isExpanded) {
      if (collapsedGroupPaths.size === 0) return;

      expansionStore.set({ collapsedGroupPaths: NOTHING_COLLAPSED });

      return;
    }

    const treeArgs = { data: dataStore.get().data };
    const { foldableGroupPaths, rows } = resolveTableGroupTree({
      ...treeArgs,
      collapsedGroupPaths,
    });

    if (
      areAllGroupsCollapsed({
        collapsedGroupPaths,
        foldableGroupPaths,
      })
    ) {
      return;
    }

    const { columns } = columnsStore.get();
    const focusState = focusStore.get();
    const groupPathKey = resolveOutermostGroupPathKey({
      columns,
      focusedRowKey: focusState.rowKey,
      rows,
    });
    applyGroupFoldFocus({
      columns,
      container: containerRef.current,
      focusState,
      focusStore,
      groupPathKey,
      rowHeight: metaStore.get().rowHeight,
      rows: resolveTableGroupTree({
        ...treeArgs,
        collapsedGroupPaths: foldableGroupPaths,
      }).rows,
    });

    expansionStore.set({ collapsedGroupPaths: foldableGroupPaths });
  };
};
