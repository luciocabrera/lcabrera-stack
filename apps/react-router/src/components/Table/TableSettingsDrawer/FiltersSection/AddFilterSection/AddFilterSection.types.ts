export type AddFilterSectionProps = {
  readonly expandedFilters: Set<string>;
  readonly isBussy?: boolean;
  readonly onDropdownOpenChange?: (isOpen: boolean) => void;
  readonly onExpandedFiltersChange: (expandedFilters: Set<string>) => void;
};
