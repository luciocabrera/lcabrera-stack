import type { TableGroupFold } from '#ui/components/Table/Table.types';

type IsGroupCollapsedArgs = {
  readonly defaultFold: TableGroupFold;
  readonly pathKey: string;
  readonly toggledGroupPaths: ReadonlySet<string>;
};

export const isGroupCollapsed = ({
  defaultFold,
  pathKey,
  toggledGroupPaths,
}: IsGroupCollapsedArgs) => {
  const isToggled = toggledGroupPaths.has(pathKey);

  return defaultFold === 'collapsed' ? !isToggled : isToggled;
};
