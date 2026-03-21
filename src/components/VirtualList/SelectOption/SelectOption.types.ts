export type SelectOptionProps = {
  readonly hasCheckbox?: boolean;
  readonly isLoading: boolean;
  readonly isSelected: boolean;
  readonly onToggle: () => void;
  readonly option: string;
};
