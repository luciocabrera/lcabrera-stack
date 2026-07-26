export type ResolveSingleModeChangeArgs = {
  readonly selected: readonly string[];
  readonly selectedValues: readonly string[];
};

export const resolveSingleModeChange = ({
  selected,
  selectedValues,
}: ResolveSingleModeChangeArgs) => {
  const selectedSet = new Set(selected);
  const newValue = selectedValues.find((value) => !selectedSet.has(value));

  return newValue ? [newValue] : [];
};
