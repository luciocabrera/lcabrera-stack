import type { TableGroupFold } from '#ui/components/Table/Table.types';

type SetCollapsedGroupLevelArgs = {
  readonly defaultFold: TableGroupFold;
  readonly isCollapsed: boolean;
  readonly levelPaths: ReadonlySet<string>;
  readonly toggledGroupPaths: ReadonlySet<string>;
};

export const setCollapsedGroupLevel = ({
  defaultFold,
  isCollapsed,
  levelPaths,
  toggledGroupPaths,
}: SetCollapsedGroupLevelArgs): ReadonlySet<string> => {
  const next = new Set(toggledGroupPaths);
  const isMember = defaultFold === 'collapsed' ? !isCollapsed : isCollapsed;

  for (const pathKey of levelPaths) {
    if (isMember) next.add(pathKey);
    else next.delete(pathKey);
  }

  return next.size === toggledGroupPaths.size ? toggledGroupPaths : next;
};
