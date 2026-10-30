import {
  countCollapsedGroups,
  resolveFoldAllTarget,
  resolveTableGroupTree,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';

import { useGroupFoldStores } from './useGroupFoldStores.hook';
import { applyGroupFoldFocus, resolveOutermostGroupPathKey } from './utils';

export const useSetAllTableGroupsExpanded = <
  TData extends Record<string, unknown>,
>() => {
  const {
    columnsStore,
    containerRef,
    dataStore,
    expansionStore,
    focusStore,
    readRowHeight,
  } = useGroupFoldStores<TData>();

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
      rowHeight: readRowHeight(),
      rows: resolveTableGroupTree({
        ...treeArgs,
        toggledGroupPaths: target,
      }).rows,
    });

    expansionStore.set({ toggledGroupPaths: target });
  };
};
