import {
  collectGroupLevelFoldPaths,
  resolveTableGroupTree,
  setCollapsedGroupLevel,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';

import { useGroupFoldStores } from './useGroupFoldStores.hook';
import { applyGroupFoldFocus, resolveFoldedAncestorPathKey } from './utils';

type SetTableGroupLevelExpandedArgs = {
  readonly columnKey: string;
  readonly isExpanded: boolean;
};

export const useSetTableGroupLevelExpanded = <
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

  return ({ columnKey, isExpanded }: SetTableGroupLevelExpandedArgs) => {
    const { defaultFold, toggledGroupPaths } = expansionStore.get();
    const treeArgs = { data: dataStore.get().data, defaultFold };
    const { rowMeta, rows } = resolveTableGroupTree({
      ...treeArgs,
      toggledGroupPaths,
    });
    const levelPaths = collectGroupLevelFoldPaths({ columnKey, rowMeta });
    const nextCollapsed = setCollapsedGroupLevel({
      defaultFold,
      isCollapsed: !isExpanded,
      levelPaths,
      toggledGroupPaths,
    });

    if (nextCollapsed === toggledGroupPaths) return;

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
        rowHeight: readRowHeight(),
        rows: resolveTableGroupTree({
          ...treeArgs,
          toggledGroupPaths: nextCollapsed,
        }).rows,
      });
    }

    expansionStore.set({ toggledGroupPaths: nextCollapsed });
  };
};
