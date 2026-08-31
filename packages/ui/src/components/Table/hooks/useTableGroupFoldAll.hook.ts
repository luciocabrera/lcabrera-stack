import { useSetAllTableGroupsExpanded } from '#ui/components/Table/contexts/TableConfig/expansion/actions';
import { useGetTableCollapsedGroupPaths } from '#ui/components/Table/contexts/TableConfig/expansion/selectors';
import { areAllGroupsCollapsed } from '#ui/components/Table/contexts/TableConfig/expansion/utils';

import { useTableGroupTree } from './useTableGroupTree.hook';

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
