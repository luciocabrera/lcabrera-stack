export type VirtualizedOptionProps = {
  filteredOptions: string[];
  index: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onToggle: (option: string) => void;
  selectedValues: string[];
};
