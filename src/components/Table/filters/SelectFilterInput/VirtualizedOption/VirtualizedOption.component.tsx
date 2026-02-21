import type { VirtualizedOptionProps } from './VirtualizedOption.types';

import { SelectAllOption } from '../SelectAllOption';
import { SelectOption } from '../SelectOption';

export const VirtualizedOption = ({
  filteredOptions,
  index,
  isAllSelected,
  isLoading,
  onSelectAll,
  onToggle,
  selectedValues,
}: VirtualizedOptionProps) => {
  const hasMultipleOptions = filteredOptions.length > 1;

  // "Select All" is at index 0 (if there's more than 1 option)
  if (index === 0 && hasMultipleOptions) {
    return (
      <SelectAllOption
        isAllSelected={isAllSelected}
        isLoading={isLoading}
        onSelectAll={onSelectAll}
      />
    );
  }

  // Adjust option index to account for "Select All" at position 0
  const optionIndex = hasMultipleOptions ? index - 1 : index;
  const option = filteredOptions[optionIndex];

  const handleToggle = () => {
    if (option) onToggle(option);
  };

  if (option === undefined) return;

  return (
    <SelectOption
      isLoading={isLoading}
      isSelected={selectedValues.includes(option)}
      onToggle={handleToggle}
      option={option}
    />
  );
};
