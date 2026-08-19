import {
  areAllGroupsCollapsed,
  canDrillGroups,
  resolveTableGroupTree,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { moveTableFocusToRow } from '#ui/components/Table/contexts/TableFocus/focus/actions/utils';
import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';

import {
  resolveGroupCollapseFocusTarget,
  resolveOutermostGroupPathKey,
} from './utils';

/** Expansion is the complement of the collapsed set (ADR-067), so "everything open" is empty. */
const NOTHING_COLLAPSED: ReadonlySet<string> = new Set<string>();

/**
 * Opens or closes every group in one action (#774).
 *
 * Local, like the per-row toggle it generalises: expansion changes nothing
 * server-side, so this touches no URL param and triggers no revalidation
 * (ADR-061). Drilled pages are left alone — a fold hides rows, and discarding a
 * page the user fetched is a different decision, owned by the read that
 * invalidated it (ADR-079).
 *
 * **What it collapses is the tree's own foldable set**, not a second
 * enumeration of it: the same `foldableGroupPaths` every chevron is drawn from,
 * so "collapse all" cannot close a group the grid never offered to close, and
 * cannot leave one open that it did. That set excludes any group without a row
 * of its own, which is what stops a `flat` grid from folding itself out of
 * existence — see `collectFoldableGroupPaths`.
 *
 * It therefore collapses **to the outermost level**, never to nothing: a
 * top-level group and the grand total are nobody's parent, so neither is in the
 * set and both stay on screen, leaving something to expand back from.
 *
 * Focus is repositioned **before** the store write, for the ordering reason
 * `useToggleTableGroupExpansion` records: the focused cell's unmount releases
 * the grid's tab stop only while the store still names that cell.
 */
export const useSetAllTableGroupsExpanded = <
  TData extends Record<string, unknown>,
>() => {
  const {
    columnsStore,
    expansionStore,
    groupingStore,
    metaStore,
    onDrillGroup,
  } = useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const { focusStore } = useTableFocusContextValue();
  const containerRef = useTableContainerRef();

  return (isExpanded: boolean) => {
    const { collapsedGroupPaths, drilledGroups } = expansionStore.get();

    if (isExpanded) {
      if (collapsedGroupPaths.size === 0) return;

      expansionStore.set({ collapsedGroupPaths: NOTHING_COLLAPSED });

      return;
    }

    const treeArgs = {
      canDrill: canDrillGroups({
        isGroupDrillEnabled: metaStore.get().isGroupDrillEnabled,
        onDrillGroup,
      }),
      data: dataStore.get().data,
      drilledGroups,
      groupingKeys: groupingStore.get().keys,
    };
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
    const target =
      groupPathKey === undefined
        ? undefined
        : resolveGroupCollapseFocusTarget({
            columns,
            focusedRowKey: focusState.rowKey,
            groupPathKey,
            rows: resolveTableGroupTree({
              ...treeArgs,
              collapsedGroupPaths: foldableGroupPaths,
            }).rows,
          });

    if (target !== undefined) {
      moveTableFocusToRow({
        container: containerRef.current,
        focusState,
        focusStore,
        rowHeight: metaStore.get().rowHeight,
        ...target,
      });
    }

    expansionStore.set({ collapsedGroupPaths: foldableGroupPaths });
  };
};
