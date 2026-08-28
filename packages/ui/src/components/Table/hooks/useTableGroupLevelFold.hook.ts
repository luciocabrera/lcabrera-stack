import { useSetTableGroupLevelExpanded } from '#ui/components/Table/contexts/TableConfig/expansion/actions';
import { useGetTableCollapsedGroupPaths } from '#ui/components/Table/contexts/TableConfig/expansion/selectors';
import { collectGroupLevelFoldPaths } from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';

import { useTableGroupTree } from './useTableGroupTree.hook';

/**
 * The fold-one-level pair for a column's menu, and whether either has anything to do —
 * `useTableGroupFoldAll` narrowed to the level the column states (#1020).
 * `hasGroupLevel` is the single gate the two items are offered behind, and it is read off
 * the tree rather than from the key list: a level with no row of its own never reaches
 * `foldableGroupPaths`, so the outermost key and a column that is no key at all both
 * answer "nothing to fold" without either being named as a case (ADR-083).
 */
export const useTableGroupLevelFold = <
  TData extends Record<string, unknown> = Record<string, unknown>,
>(
  columnKey: string,
) => {
  const { foldableGroupPaths } = useTableGroupTree<TData>();
  const data = useGetTableData<TData>();
  const groupingKeys = useGetTableGroupingKeys();
  const collapsedGroupPaths = useGetTableCollapsedGroupPaths();
  const setGroupLevelExpanded = useSetTableGroupLevelExpanded<TData>();
  const levelPaths = collectGroupLevelFoldPaths({
    columnKey,
    data,
    foldableGroupPaths,
    groupingKeys,
  });
  // Both enabled states from one count, so a disabled collapse and an expand
  // that reports something to open cannot contradict each other.
  const collapsedAtLevel = [...levelPaths].filter((pathKey) =>
    collapsedGroupPaths.has(pathKey),
  ).length;

  return {
    hasGroupLevel: levelPaths.size > 0,
    isCollapseLevelEnabled: collapsedAtLevel < levelPaths.size,
    isExpandLevelEnabled: collapsedAtLevel > 0,
    setGroupLevelExpanded,
  };
};
