type AreAllGroupsCollapsedArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly foldableGroupPaths: ReadonlySet<string>;
};

/**
 * Whether every group that *can* be folded already is — the question both the collapse-all
 * action and the control offering it have to answer, asked once so a disabled button and
 * an action that would do nothing cannot disagree (#774).
 */
export const areAllGroupsCollapsed = ({
  collapsedGroupPaths,
  foldableGroupPaths,
}: AreAllGroupsCollapsedArgs) =>
  [...foldableGroupPaths].every((pathKey) => collapsedGroupPaths.has(pathKey));
