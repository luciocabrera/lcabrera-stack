type SetCollapsedGroupLevelArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly isCollapsed: boolean;
  readonly levelPaths: ReadonlySet<string>;
};

/**
 * One level's groups folded or unfolded together, leaving every path outside that level
 * exactly as it was — which is what keeps the other levels' expansion untouched.
 * The **same set instance** comes back when nothing moved, as `pruneCollapsedGroupPaths`
 * does, so the caller skips the write by identity. Size decides it because the loop only
 * ever adds or only ever deletes, so an unchanged size is an unchanged set.
 */
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
