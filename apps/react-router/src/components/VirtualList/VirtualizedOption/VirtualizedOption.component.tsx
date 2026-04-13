import type { VirtualizedOptionProps } from './VirtualizedOption.types.ts';

import { SelectAllOption } from '../SelectAllOption/index.ts';
import { SelectOption } from '../SelectOption/index.ts';

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

  const handleToggle = () => {
    if (option) onToggle(option);
  };

  if (option === undefined) return;

  return (
    <SelectOption
      hasCheckbox={hasCheckboxes}
      isLoading={isLoading}
      isSelected={selectedValues.includes(option)}
      onToggle={handleToggle}
      option={option}
    />
  );
};
