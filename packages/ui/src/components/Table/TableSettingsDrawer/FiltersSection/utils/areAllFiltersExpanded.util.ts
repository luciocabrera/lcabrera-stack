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
}: AreAllFiltersExpandedArgs) =>
  filterKeys.length > 0 &&
  filterKeys.every((key) => expandedFilters.includes(key));
