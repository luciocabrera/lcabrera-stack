export type ActiveFiltersListProps = {
  expandedFilters: Set<string>;
  onExpandedFiltersChange: (expandedFilters: Set<string>) => void;
};
