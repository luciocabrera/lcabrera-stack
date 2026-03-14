export type AddFilterSectionProps = {
  expandedFilters: Set<string>;
  onDropdownOpenChange?: (isOpen: boolean) => void;
  onExpandedFiltersChange: (expandedFilters: Set<string>) => void;
};
