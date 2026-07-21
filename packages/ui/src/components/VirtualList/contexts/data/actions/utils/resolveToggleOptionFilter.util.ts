import type { SelectFilter } from '@lcabrera/ui/types/filterOperators.types';

type ResolveToggleOptionFilterArgs = {
  readonly option: string;
  readonly selectedValues: readonly string[];
};

/** Builds the next SelectFilter after toggling a single option. */
export const resolveToggleOptionFilter = ({
  option,
  selectedValues,
}: ResolveToggleOptionFilterArgs) => {
  const values = selectedValues.includes(option)
    ? selectedValues.filter((value) => value !== option)
    : [...selectedValues, option];

  const filter: SelectFilter = { type: 'select', values };

  return filter;
};
