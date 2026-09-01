type GetIsAllSelectedArgs = {
  readonly filteredOptions: readonly string[];
  readonly selectedValues: readonly string[];
};

export const getIsAllSelected = ({
  filteredOptions,
  selectedValues,
}: GetIsAllSelectedArgs) => {
  if (filteredOptions.length === 0) return false;

  const selected = new Set(selectedValues);

  return filteredOptions.every((option) => selected.has(option));
};
