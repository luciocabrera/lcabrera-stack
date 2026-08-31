import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import {
  isGroupCollapsed,
  resolveTableGroupTree,
  toggleCollapsedGroupPath,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';

import { applyGroupFoldFocus } from './utils';

export const useToggleTableGroupExpansion = <
  TData extends Record<string, unknown>,
>() => {
  const { columnsStore, expansionStore, metaStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const { focusStore } = useTableFocusContextValue();
  const containerRef = useTableContainerRef();

  return (path: readonly TableGroupKeyValue[]) => {
    const { defaultFold, toggledGroupPaths } = expansionStore.get();
    const groupPathKey = resolveGroupPathKey(path);

    const nextCollapsed = toggleCollapsedGroupPath({
      pathKey: groupPathKey,
      toggledGroupPaths,
    });

    // Asked of the predicate, not of membership: under a `collapsed` default
    // the set holds the groups that are *open*, so a `has` here would move
    // focus on the expand rather than on the collapse.
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
        rowHeight: metaStore.get().rowHeight,
        rows,
      });
    }

    expansionStore.set({ toggledGroupPaths: nextCollapsed });
  };
};
