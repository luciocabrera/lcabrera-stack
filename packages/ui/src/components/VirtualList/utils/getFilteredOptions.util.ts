import type { ListFilterMode } from '../VirtualList.types';

export type GetFilteredOptionsArgs = {
  readonly listFilterMode: ListFilterMode;
  readonly options: readonly string[];
  readonly searchTerm: string;
  readonly selectedValues: readonly string[];
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
    result = result.filter((option) => option.toLowerCase().includes(term));
  }

  if (listFilterMode === 'all') return result;

  // Built once per call, not once per option: this runs from useSetSearchTerm
  // on every keystroke, over a list large enough to be virtualized.
  const selected = new Set(selectedValues);

  return listFilterMode === 'selected'
    ? result.filter((option) => selected.has(option))
    : result.filter((option) => !selected.has(option));
};
