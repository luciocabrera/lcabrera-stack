import type { VirtualizedOptionProps } from './VirtualizedOption.types';

import { useToggleOption, useToggleSelectAll } from '../contexts/data/actions';
import {
  useGetFilteredOptions,
  useGetIsAllSelected,
  useGetIsLoadingOptions,
  useGetSelectedValues,
  useGetShouldShowSelectAll,
} from '../contexts/data/selectors';
import { useGetHasCheckboxes } from '../contexts/list/selectors';
import { SelectAllOption } from '../SelectAllOption';
import { SelectOption } from '../SelectOption';

export const VirtualizedOption = ({ index }: VirtualizedOptionProps) => {
  const filteredOptions = useGetFilteredOptions();
  const hasCheckboxes = useGetHasCheckboxes();
  const isAllSelected = useGetIsAllSelected();
  const isLoadingOptions = useGetIsLoadingOptions();
  const selectedValues = useGetSelectedValues();
  const shouldShowSelectAll = useGetShouldShowSelectAll();
  const toggleOption = useToggleOption();
  const toggleSelectAll = useToggleSelectAll();

  // "Select All" is at index 0 (if enabled and more than 1 option)
  if (index === 0 && shouldShowSelectAll) {
    return (
      <SelectAllOption
        isAllSelected={isAllSelected}
        isLoading={isLoadingOptions}
        onSelectAll={toggleSelectAll}
      />
    );
  }

  // Adjust option index to account for "Select All" at position 0
  const optionIndex = shouldShowSelectAll ? index - 1 : index;
  const option = filteredOptions[optionIndex];

  if (option !== undefined) {
    const handleToggle = () => {
      toggleOption(option);
    };

    return (
      <SelectOption
        hasCheckbox={hasCheckboxes}
        isLoading={isLoadingOptions}
        isSelected={selectedValues.includes(option)}
        onToggle={handleToggle}
        option={option}
      />
    );
  }
};
