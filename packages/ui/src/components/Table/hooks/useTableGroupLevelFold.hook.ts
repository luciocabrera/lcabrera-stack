import { useSetTableGroupLevelExpanded } from '#ui/components/Table/contexts/TableConfig/expansion/actions';
import {
  useGetTableDefaultGroupFold,
  useGetTableToggledGroupPaths,
} from '#ui/components/Table/contexts/TableConfig/expansion/selectors';
import {
  collectGroupLevelFoldPaths,
  countCollapsedGroups,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';

import { useTableGroupTree } from './useTableGroupTree.hook';

export const useTableGroupLevelFold = <
  TData extends Record<string, unknown> = Record<string, unknown>,
>(
  columnKey: string,
) => {
  const { rowMeta } = useTableGroupTree<TData>();
  const groupingKeys = useGetTableGroupingKeys();
  const defaultFold = useGetTableDefaultGroupFold();
  const toggledGroupPaths = useGetTableToggledGroupPaths();
  const setGroupLevelExpanded = useSetTableGroupLevelExpanded<TData>();
  const levelPaths = collectGroupLevelFoldPaths({ columnKey, rowMeta });
  const collapsedAtLevel = countCollapsedGroups({
    defaultFold,
    foldableGroupPaths: levelPaths,
    toggledGroupPaths,
  });

  return {
    hasGroupLevel: groupingKeys.includes(columnKey),
    isCollapseLevelEnabled: collapsedAtLevel < levelPaths.size,
    isExpandLevelEnabled: collapsedAtLevel > 0,
    setGroupLevelExpanded,
  };
};
