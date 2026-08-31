type AreAllGroupsCollapsedArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly foldableGroupPaths: ReadonlySet<string>;
};

export const areAllGroupsCollapsed = ({
  collapsedGroupPaths,
  foldableGroupPaths,
}: AreAllGroupsCollapsedArgs) =>
  [...foldableGroupPaths].every((pathKey) => collapsedGroupPaths.has(pathKey));
