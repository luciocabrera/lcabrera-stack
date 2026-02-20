import type { VirtualizedOptionProps } from './VirtualizedOption.types';

import { SelectAllOption } from '../SelectAllOption';
import { SelectOption } from '../SelectOption';

export const VirtualizedOption = ({
  filteredOptions,
  index,
  isAllSelected,
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
        onSelectAll={onSelectAll}
      />
    );
  }

  // Adjust option index to account for "Select All" at position 0
  const optionIndex = hasMultipleOptions ? index - 1 : index;
  const option = filteredOptions[optionIndex];

  if (!option) return;

  return (
    <SelectOption
      isSelected={selectedValues.includes(option)}
      onToggle={() => {
        onToggle(option);
      }}
      option={option}
    />
  );
};
