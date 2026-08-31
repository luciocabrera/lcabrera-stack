type ToggleCollapsedGroupPathArgs = {
  readonly pathKey: string;
  readonly toggledGroupPaths: ReadonlySet<string>;
};

/**
 * The set is rebuilt rather than mutated because it is the store's current value:
 * `useStore.set` compares the merged state shallowly, so a set mutated in place is `===`
 * its predecessor and no subscriber is ever notified.
 */
export const toggleCollapsedGroupPath = ({
  pathKey,
  toggledGroupPaths,
}: ToggleCollapsedGroupPathArgs): ReadonlySet<string> => {
  const next = new Set(toggledGroupPaths);

  if (!next.delete(pathKey)) next.add(pathKey);

  return next;
};
