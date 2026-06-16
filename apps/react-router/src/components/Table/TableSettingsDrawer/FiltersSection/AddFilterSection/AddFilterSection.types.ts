export type AddFilterSectionProps = {
  readonly expandedFilters: Set<string>;
  readonly isBusy?: boolean;
  readonly onDropdownOpenChange?: (isOpen: boolean) => void;
  readonly onExpandedFiltersChange: (expandedFilters: Set<string>) => void;
};
