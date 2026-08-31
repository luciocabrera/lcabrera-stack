import type { TableGroupFold } from '#ui/components/Table/Table.types';

type SetCollapsedGroupLevelArgs = {
  readonly defaultFold: TableGroupFold;
  readonly isCollapsed: boolean;
  readonly levelPaths: ReadonlySet<string>;
  readonly toggledGroupPaths: ReadonlySet<string>;
};

/**
 * One level's groups folded or unfolded together, leaving every path outside that level
 * exactly as it was — which is what keeps the other levels' expansion untouched.
 * Asking for `isCollapsed` **removes** each path from the set under a `collapsed` default
 * and adds it under an `expanded` one, because the set holds the groups folded the other
 * way from the default (see `isGroupCollapsed`).
 * The **same set instance** comes back when nothing moved, as `pruneCollapsedGroupPaths`
 * does, so the caller skips the write by identity. Size decides it because the loop only
 * ever adds or only ever deletes, so an unchanged size is an unchanged set.
 */
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
