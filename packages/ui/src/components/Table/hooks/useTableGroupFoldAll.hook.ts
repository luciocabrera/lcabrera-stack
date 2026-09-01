import { useSetAllTableGroupsExpanded } from '#ui/components/Table/contexts/TableConfig/expansion/actions';
import {
  useGetTableDefaultGroupFold,
  useGetTableToggledGroupPaths,
} from '#ui/components/Table/contexts/TableConfig/expansion/selectors';
import { countCollapsedGroups } from '#ui/components/Table/contexts/TableConfig/expansion/utils';

import { useTableGroupTree } from './useTableGroupTree.hook';

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
