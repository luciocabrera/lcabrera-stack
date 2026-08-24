type AreAllFiltersExpandedArgs = {
  readonly expandedFilters: readonly string[];
  readonly filterKeys: readonly string[];
};

export const areAllFiltersExpanded = ({
  expandedFilters,
  filterKeys,
}: AreAllFiltersExpandedArgs) => {
  if (filterKeys.length === 0) return false;

  const expanded = new Set(expandedFilters);

  return filterKeys.every((key) => expanded.has(key));
};
