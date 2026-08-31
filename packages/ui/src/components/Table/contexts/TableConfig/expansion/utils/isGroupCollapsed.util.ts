import type { TableGroupFold } from '#ui/components/Table/Table.types';

type IsGroupCollapsedArgs = {
  readonly defaultFold: TableGroupFold;
  readonly pathKey: string;
  readonly toggledGroupPaths: ReadonlySet<string>;
};

/**
 * Whether one group is collapsed, which is the only question the set's membership
 * answers — and it answers it differently either side of `defaultFold`, since the set
 * holds the groups folded the other way from it.
 * Every read of the set goes through here so the two polarities cannot come to disagree
 * about the same path.
 */
export const isGroupCollapsed = ({
  defaultFold,
  pathKey,
  toggledGroupPaths,
}: IsGroupCollapsedArgs) => {
  const isToggled = toggledGroupPaths.has(pathKey);

  return defaultFold === 'collapsed' ? !isToggled : isToggled;
};
