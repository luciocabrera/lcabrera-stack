type ToggleCollapsedGroupPathArgs = {
  readonly pathKey: string;
  readonly toggledGroupPaths: ReadonlySet<string>;
};

export const toggleCollapsedGroupPath = ({
  pathKey,
  toggledGroupPaths,
}: ToggleCollapsedGroupPathArgs): ReadonlySet<string> => {
  const next = new Set(toggledGroupPaths);

  if (!next.delete(pathKey)) next.add(pathKey);

  return next;
};
