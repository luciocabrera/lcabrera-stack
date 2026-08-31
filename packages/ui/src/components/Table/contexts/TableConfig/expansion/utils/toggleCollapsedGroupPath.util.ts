type ToggleCollapsedGroupPathArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly pathKey: string;
};

export const toggleCollapsedGroupPath = ({
  collapsedGroupPaths,
  pathKey,
}: ToggleCollapsedGroupPathArgs): ReadonlySet<string> => {
  const next = new Set(collapsedGroupPaths);

  if (!next.delete(pathKey)) next.add(pathKey);

  return next;
};
