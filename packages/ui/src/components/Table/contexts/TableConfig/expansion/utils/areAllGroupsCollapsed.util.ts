type AreAllGroupsCollapsedArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly foldableGroupPaths: ReadonlySet<string>;
};

/**
 * Whether every group that *can* be folded already is — the question both the
 * collapse-all action and the control offering it have to answer, asked once so
 * a disabled button and an action that would do nothing cannot disagree (#774).
 *
 * Membership is compared, not size. A collapsed path the current rows no longer
 * contain makes the two sets the same size and different, and
 * `pruneCollapsedGroupPaths` only runs on a read — so between one refetch and
 * the next, size alone would report "already collapsed" for a grid with open
 * groups in it and leave the control dead.
 *
 * An empty foldable set answers `true`, which is why the caller offering the
 * control also asks whether there is anything to fold: a grid with no groups in
 * it has indeed collapsed all of them, and that is not a reason to enable a
 * button.
 */
export const areAllGroupsCollapsed = ({
  collapsedGroupPaths,
  foldableGroupPaths,
}: AreAllGroupsCollapsedArgs) =>
  [...foldableGroupPaths].every((pathKey) => collapsedGroupPaths.has(pathKey));
