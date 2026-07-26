type AreAllFiltersExpandedArgs = {
  readonly expandedFilters: readonly string[];
  readonly filterKeys: readonly string[];
};

/**
 * Whether every active filter key is currently expanded. False when there
 * are no active filters. Used by the filters toolbar to derive the
 * expand-all disabled flag.
 */
export const areAllFiltersExpanded = ({
  expandedFilters,
  filterKeys,
}: AreAllFiltersExpandedArgs) => {
  if (filterKeys.length === 0) return false;

  const expanded = new Set(expandedFilters);

  return filterKeys.every((key) => expanded.has(key));
};
