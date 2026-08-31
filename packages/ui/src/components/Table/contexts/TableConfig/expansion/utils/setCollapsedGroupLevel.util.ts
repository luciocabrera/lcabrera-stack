type SetCollapsedGroupLevelArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly isCollapsed: boolean;
  readonly levelPaths: ReadonlySet<string>;
};

export const setCollapsedGroupLevel = ({
  collapsedGroupPaths,
  isCollapsed,
  levelPaths,
}: SetCollapsedGroupLevelArgs): ReadonlySet<string> => {
  const next = new Set(collapsedGroupPaths);

  for (const pathKey of levelPaths) {
    if (isCollapsed) next.add(pathKey);
    else next.delete(pathKey);
  }

  return next.size === collapsedGroupPaths.size ? collapsedGroupPaths : next;
};
