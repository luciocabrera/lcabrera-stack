import type { SelectFilter } from '#ui/types/filterOperators.types';

type ResolveToggleOptionFilterArgs = {
  readonly option: string;
  readonly selectedValues: readonly string[];
};

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
