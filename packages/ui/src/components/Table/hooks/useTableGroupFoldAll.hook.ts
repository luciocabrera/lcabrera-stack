import { useSetAllTableGroupsExpanded } from '#ui/components/Table/contexts/TableConfig/expansion/actions';
import { useGetTableCollapsedGroupPaths } from '#ui/components/Table/contexts/TableConfig/expansion/selectors';
import { areAllGroupsCollapsed } from '#ui/components/Table/contexts/TableConfig/expansion/utils';

import { useTableGroupTree } from './useTableGroupTree.hook';

/**
 * The fold-every-group pair and whether either has anything to do (#774) — one
 * derivation, so the two controls offering it cannot disagree about when the
 * grid is already fully open or fully folded.
 *
 * The foldable set comes from `useTableGroupTree` rather than being enumerated
 * again here, which is the point: it is the same set every per-row chevron is
 * drawn from, so a disabled "Collapse All" means exactly "no chevron on screen
 * would close anything". A second enumeration is where those two answers would
 * drift apart.
 *
 * No route-capability gate is read. Both answers come from the rows, and a grid
 * whose route never declared grouping has no group rows in them — so the pair
 * reports nothing to fold without a second question that could contradict the
 * first.
 */
export const useTableGroupFoldAll = <
  TData extends Record<string, unknown> = Record<string, unknown>,
>() => {
  const { foldableGroupPaths } = useTableGroupTree<TData>();
  const collapsedGroupPaths = useGetTableCollapsedGroupPaths();
  const setAllGroupsExpanded = useSetAllTableGroupsExpanded<TData>();

  return {
    isCollapseAllEnabled:
      foldableGroupPaths.size > 0 &&
      !areAllGroupsCollapsed({ collapsedGroupPaths, foldableGroupPaths }),
    isExpandAllEnabled: collapsedGroupPaths.size > 0,
    setAllGroupsExpanded,
  };
};
