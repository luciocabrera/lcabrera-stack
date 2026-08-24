type ToggleCollapsedGroupPathArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly pathKey: string;
};

/**
 * The set is rebuilt rather than mutated because it is the store's current value:
 * `useStore.set` compares the merged state shallowly, so a set mutated in place is `===`
 * its predecessor and no subscriber is ever notified.
 */
export const toggleCollapsedGroupPath = ({
  collapsedGroupPaths,
  pathKey,
}: ToggleCollapsedGroupPathArgs): ReadonlySet<string> => {
  const next = new Set(collapsedGroupPaths);

  if (!next.delete(pathKey)) next.add(pathKey);

  return next;
};
