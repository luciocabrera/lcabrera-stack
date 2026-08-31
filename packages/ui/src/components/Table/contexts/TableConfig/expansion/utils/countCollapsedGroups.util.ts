import type { TableGroupFold } from '#ui/components/Table/Table.types';

import { isGroupCollapsed } from './isGroupCollapsed.util';

type CountCollapsedGroupsArgs = {
  readonly defaultFold: TableGroupFold;
  readonly foldableGroupPaths: ReadonlySet<string>;
  readonly toggledGroupPaths: ReadonlySet<string>;
};

/**
 * How many of the groups that *can* be folded are folded — the one number both fold-all
 * controls and both fold-all actions read, so a disabled button and an action that would
 * do nothing cannot disagree (#774).
 * A count rather than the two predicates it replaces, because the set's membership no
 * longer answers "collapsed" on its own: under a `collapsed` default an empty set is a
 * fully folded grid, which is what a size check got backwards.
 */
export const countCollapsedGroups = ({
  defaultFold,
  foldableGroupPaths,
  toggledGroupPaths,
}: CountCollapsedGroupsArgs) =>
  [...foldableGroupPaths].filter((pathKey) =>
    isGroupCollapsed({ defaultFold, pathKey, toggledGroupPaths }),
  ).length;
