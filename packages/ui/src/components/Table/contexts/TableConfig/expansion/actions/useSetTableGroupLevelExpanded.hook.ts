import {
  collectGroupLevelFoldPaths,
  resolveTableGroupTree,
  setCollapsedGroupLevel,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';

import { applyGroupFoldFocus, resolveFoldedAncestorPathKey } from './utils';

type SetTableGroupLevelExpandedArgs = {
  readonly columnKey: string;
  readonly isExpanded: boolean;
};

/**
 * Local, like the fold-all it narrows: expansion changes nothing server-side, so this
 * touches no URL param and triggers no revalidation (ADR-061).
 * **What it folds is the tree's own foldable set, filtered to one level** — the same
 * `foldableGroupPaths` every chevron is drawn from, so this can no more close a group the
 * grid refused to offer than "collapse all" can (ADR-083). Every path outside the level
 * is carried through untouched, which is what leaves the other levels' expansion alone.
 */
export const useSetTableGroupLevelExpanded = <
  TData extends Record<string, unknown>,
>() => {
  const { columnsStore, expansionStore, groupingStore, metaStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const { focusStore } = useTableFocusContextValue();
  const containerRef = useTableContainerRef();

  return ({ columnKey, isExpanded }: SetTableGroupLevelExpandedArgs) => {
    const { collapsedGroupPaths } = expansionStore.get();
    const treeArgs = { data: dataStore.get().data };
    const { foldableGroupPaths, rows } = resolveTableGroupTree({
      ...treeArgs,
      collapsedGroupPaths,
    });
    const levelPaths = collectGroupLevelFoldPaths({
      columnKey,
      data: treeArgs.data,
      foldableGroupPaths,
      groupingKeys: groupingStore.get().keys,
    });
    const nextCollapsed = setCollapsedGroupLevel({
      collapsedGroupPaths,
      isCollapsed: !isExpanded,
      levelPaths,
    });

    // Nothing at this level can change — the same set instance back. The early
    // return is the action's half of the disabled control, so a click that
    // slipped past the button writes no store either.
    if (nextCollapsed === collapsedGroupPaths) return;

    if (!isExpanded) {
      const { columns } = columnsStore.get();
      const focusState = focusStore.get();
      const groupPathKey = resolveFoldedAncestorPathKey({
        columns,
        focusedRowKey: focusState.rowKey,
        foldedPaths: levelPaths,
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
          collapsedGroupPaths: nextCollapsed,
        }).rows,
      });
    }

    expansionStore.set({ collapsedGroupPaths: nextCollapsed });
  };
};
