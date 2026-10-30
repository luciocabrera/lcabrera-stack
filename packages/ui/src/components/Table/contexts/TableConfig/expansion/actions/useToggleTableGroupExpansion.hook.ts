import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import {
  isGroupCollapsed,
  resolveTableGroupTree,
  toggleCollapsedGroupPath,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

import { useGroupFoldStores } from './useGroupFoldStores.hook';
import { applyGroupFoldFocus } from './utils';

export const useToggleTableGroupExpansion = <
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

  return (path: readonly TableGroupKeyValue[]) => {
    const { defaultFold, toggledGroupPaths } = expansionStore.get();
    const groupPathKey = resolveGroupPathKey(path);

    const nextCollapsed = toggleCollapsedGroupPath({
      pathKey: groupPathKey,
      toggledGroupPaths,
    });

    if (
      isGroupCollapsed({
        defaultFold,
        pathKey: groupPathKey,
        toggledGroupPaths: nextCollapsed,
      })
    ) {
      const focusState = focusStore.get();
      const { rows } = resolveTableGroupTree({
        data: dataStore.get().data,
        defaultFold,
        toggledGroupPaths: nextCollapsed,
      });
      applyGroupFoldFocus({
        columns: columnsStore.get().columns,
        container: containerRef.current,
        focusState,
        focusStore,
        groupPathKey,
        rowHeight: readRowHeight(),
        rows,
      });
    }

    expansionStore.set({ toggledGroupPaths: nextCollapsed });
  };
};
