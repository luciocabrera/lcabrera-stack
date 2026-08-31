import type { TableGroupFold } from '#ui/components/Table/Table.types';

import { isGroupCollapsed } from './isGroupCollapsed.util';

type CountCollapsedGroupsArgs = {
  readonly defaultFold: TableGroupFold;
  readonly foldableGroupPaths: ReadonlySet<string>;
  readonly toggledGroupPaths: ReadonlySet<string>;
};

export const countCollapsedGroups = ({
  defaultFold,
  foldableGroupPaths,
  toggledGroupPaths,
}: CountCollapsedGroupsArgs) =>
  [...foldableGroupPaths].filter((pathKey) =>
    isGroupCollapsed({ defaultFold, pathKey, toggledGroupPaths }),
  ).length;
