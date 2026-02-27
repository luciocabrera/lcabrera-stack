export type SelectOptionProps = {
  hasCheckbox?: boolean;
  isLoading: boolean;
  isSelected: boolean;
  onToggle: () => void;
  option: string;
};
