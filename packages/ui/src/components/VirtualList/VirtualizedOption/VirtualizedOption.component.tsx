import type { VirtualizedOptionProps } from './VirtualizedOption.types';

import { SelectAllOption } from '../SelectAllOption';
import { SelectOption } from '../SelectOption';

export const VirtualizedOption = ({
  filteredOptions,
  hasCheckboxes = true,
  hasSelectAll = true,
  index,
  isAllSelected,
  isLoading,
  onSelectAll,
  onToggle,
  selectedValues,
}: VirtualizedOptionProps) => {
  const shouldShowSelectAll = hasSelectAll && filteredOptions.length > 1;

  // "Select All" is at index 0 (if enabled and more than 1 option)
  if (index === 0 && shouldShowSelectAll) {
    return (
      <SelectAllOption
        isAllSelected={isAllSelected}
        isLoading={isLoading}
        onSelectAll={onSelectAll}
      />
    );
  }

  // Adjust option index to account for "Select All" at position 0
  const optionIndex = shouldShowSelectAll ? index - 1 : index;
  const option = filteredOptions[optionIndex];

  if (option !== undefined) {
    const handleToggle = () => {
      onToggle(option);
    };

    return (
      <SelectOption
        hasCheckbox={hasCheckboxes}
        isLoading={isLoading}
        isSelected={selectedValues.includes(option)}
        onToggle={handleToggle}
        option={option}
      />
    );
  }
};
