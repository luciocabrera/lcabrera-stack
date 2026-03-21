export type VirtualizedOptionProps = {
  readonly filteredOptions: readonly string[];
  readonly hasCheckboxes?: boolean;
  readonly hasSelectAll?: boolean;
  readonly index: number;
  readonly isAllSelected: boolean;
  readonly isLoading: boolean;
  readonly onSelectAll: () => void;
  readonly onToggle: (option: string) => void;
  readonly selectedValues: readonly string[];
};
