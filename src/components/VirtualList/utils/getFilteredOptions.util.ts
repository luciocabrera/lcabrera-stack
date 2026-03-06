import type { ListFilterMode } from '../VirtualList.types';

export type GetFilteredOptionsArgs = {
  listFilterMode: ListFilterMode;
  options: string[];
  searchTerm: string;
  selectedValues: string[];
};

export const getFilteredOptions = ({
  listFilterMode,
  options,
  searchTerm,
  selectedValues,
}: GetFilteredOptionsArgs) => {
  let result = options;

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    result = result.filter((option) =>
      option.toLowerCase().includes(term),
    );
  }

  if (listFilterMode === 'selected') {
    result = result.filter((option) => selectedValues.includes(option));
  } else if (listFilterMode === 'unselected') {
    result = result.filter((option) => !selectedValues.includes(option));
  }

  return result;
};
