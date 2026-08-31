import {
  areAllGroupsCollapsed,
  resolveTableGroupTree,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';

import { applyGroupFoldFocus, resolveOutermostGroupPathKey } from './utils';

const NOTHING_COLLAPSED: ReadonlySet<string> = new Set<string>();

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
