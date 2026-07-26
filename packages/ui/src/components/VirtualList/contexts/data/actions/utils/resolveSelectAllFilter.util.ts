import type { SelectFilter } from '@lcabrera/ui/types/filterOperators.types';

type ResolveSelectAllFilterArgs = {
  readonly filteredOptions: readonly string[];
  readonly isAllSelected: boolean;
  readonly selectedValues: readonly string[];
};

/**
 * Builds the next SelectFilter after toggling Select All: deselects every
 * visible option when all are selected, otherwise selects them all.
 */
export const resolveSelectAllFilter = ({
  filteredOptions,
  isAllSelected,
  selectedValues,
}: ResolveSelectAllFilterArgs) => {
  const visible = new Set(filteredOptions);
  const values = isAllSelected
    ? selectedValues.filter((value) => !visible.has(value))
    : [...new Set([...selectedValues, ...visible])];

  const filter: SelectFilter = { type: 'select', values };

  return filter;
};
