export type VirtualizedOptionProps = {
  filteredOptions: string[];
  hasCheckboxes?: boolean;
  hasSelectAll?: boolean;
  index: number;
  isAllSelected: boolean;
  isLoading: boolean;
  onSelectAll: () => void;
  onToggle: (option: string) => void;
  selectedValues: string[];
};
