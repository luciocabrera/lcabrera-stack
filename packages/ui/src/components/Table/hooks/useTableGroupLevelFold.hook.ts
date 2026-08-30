import { useSetTableGroupLevelExpanded } from '#ui/components/Table/contexts/TableConfig/expansion/actions';
import { useGetTableCollapsedGroupPaths } from '#ui/components/Table/contexts/TableConfig/expansion/selectors';
import { collectGroupLevelFoldPaths } from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';

import { useTableGroupTree } from './useTableGroupTree.hook';

export const useTableGroupLevelFold = <
  TData extends Record<string, unknown> = Record<string, unknown>,
>(
  columnKey: string,
) => {
  const { rowMeta } = useTableGroupTree<TData>();
  const groupingKeys = useGetTableGroupingKeys();
  const collapsedGroupPaths = useGetTableCollapsedGroupPaths();
  const setGroupLevelExpanded = useSetTableGroupLevelExpanded<TData>();
  const levelPaths = collectGroupLevelFoldPaths({ columnKey, rowMeta });
  const collapsedAtLevel = [...levelPaths].filter((pathKey) =>
    collapsedGroupPaths.has(pathKey),
  ).length;

  return {
    hasGroupLevel: groupingKeys.includes(columnKey),
    isCollapseLevelEnabled: collapsedAtLevel < levelPaths.size,
    isExpandLevelEnabled: collapsedAtLevel > 0,
    setGroupLevelExpanded,
  };
};
