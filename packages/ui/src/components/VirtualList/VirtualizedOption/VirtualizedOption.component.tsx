import type { VirtualizedOptionProps } from './VirtualizedOption.types';

import { useGetHasCheckboxes } from '../contexts/VirtualListConfig/config/selectors';
import {
  useToggleOption,
  useToggleSelectAll,
} from '../contexts/VirtualListData/data/actions';
import {
  useGetFilteredOptions,
  useGetIsAllSelected,
  useGetIsLoadingOptions,
  useGetSelectedValues,
  useGetShouldShowSelectAll,
} from '../contexts/VirtualListData/data/selectors';
import { SelectAllOption } from '../SelectAllOption';
import { SelectOption } from '../SelectOption';

/**
 * Self-connected row owner: resolves what the given window index renders
 * (Select All at index 0, otherwise an option row) and wires the pure
 * SelectAllOption/SelectOption leaves to selectors and actions.
 */
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
