import { useSetAllTableGroupsExpanded } from '#ui/components/Table/contexts/TableConfig/expansion/actions';
import {
  useGetTableDefaultGroupFold,
  useGetTableToggledGroupPaths,
} from '#ui/components/Table/contexts/TableConfig/expansion/selectors';
import { countCollapsedGroups } from '#ui/components/Table/contexts/TableConfig/expansion/utils';

import { useTableGroupTree } from './useTableGroupTree.hook';

/**
 * The fold-every-group pair and whether either has anything to do (#774) — one derivation,
 * so the two controls offering it cannot disagree about when the grid is already fully
 * open or fully folded.
 * Both answers come from the rows, and a grid whose route never declared grouping has no
 * group rows in them — so the pair reports nothing to fold without a second question that
 * could contradict the first.
 */
export const useTableGroupFoldAll = <
  TData extends Record<string, unknown> = Record<string, unknown>,
>() => {
  const { foldableGroupPaths } = useTableGroupTree<TData>();
  const defaultFold = useGetTableDefaultGroupFold();
  const toggledGroupPaths = useGetTableToggledGroupPaths();
  const setAllGroupsExpanded = useSetAllTableGroupsExpanded<TData>();
  const collapsedCount = countCollapsedGroups({
    defaultFold,
    foldableGroupPaths,
    toggledGroupPaths,
  });

  return {
    isCollapseAllEnabled: collapsedCount < foldableGroupPaths.size,
    isExpandAllEnabled: collapsedCount > 0,
    setAllGroupsExpanded,
  };
};
