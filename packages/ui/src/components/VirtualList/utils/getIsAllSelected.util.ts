type GetIsAllSelectedArgs = {
  readonly filteredOptions: readonly string[];
  readonly selectedValues: readonly string[];
};

export const getIsAllSelected = ({
  filteredOptions,
  selectedValues,
}: GetIsAllSelectedArgs) => {
  if (filteredOptions.length === 0) return false;

  // Built after the empty check so the early exit stays allocation-free. This
  // is the hottest lookup in the component: resolveListDerivedState calls it
  // unconditionally on every keystroke, and selectedValues grows to the full
  // option count once Select All is used.
  const selected = new Set(selectedValues);

  return filteredOptions.every((option) => selected.has(option));
};
