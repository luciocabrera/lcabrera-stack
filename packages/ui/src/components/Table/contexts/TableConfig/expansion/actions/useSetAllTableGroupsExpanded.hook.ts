import {
  countCollapsedGroups,
  resolveFoldAllTarget,
  resolveTableGroupTree,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';

import { applyGroupFoldFocus, resolveOutermostGroupPathKey } from './utils';

export const useSetAllTableGroupsExpanded = <
  TData extends Record<string, unknown>,
>() => {
  const { columnsStore, expansionStore, metaStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const { focusStore } = useTableFocusContextValue();
  const containerRef = useTableContainerRef();

  return (isExpanded: boolean) => {
    const { defaultFold, toggledGroupPaths } = expansionStore.get();
    const treeArgs = { data: dataStore.get().data, defaultFold };
    const { foldableGroupPaths, rows } = resolveTableGroupTree({
      ...treeArgs,
      toggledGroupPaths,
    });
    const collapsedCount = countCollapsedGroups({
      defaultFold,
      foldableGroupPaths,
      toggledGroupPaths,
    });
    const target = resolveFoldAllTarget({
      defaultFold,
      foldableGroupPaths,
      isExpanded,
    });

    if (isExpanded) {
      if (collapsedCount === 0) return;

      expansionStore.set({ toggledGroupPaths: target });

      return;
    }

    if (collapsedCount === foldableGroupPaths.size) return;

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
        toggledGroupPaths: target,
      }).rows,
    });

    expansionStore.set({ toggledGroupPaths: target });
  };
};
