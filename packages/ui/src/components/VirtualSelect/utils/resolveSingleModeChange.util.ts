export type ResolveSingleModeChangeArgs = {
  readonly selected: readonly string[];
  readonly selectedValues: readonly string[];
};

export const resolveSingleModeChange = ({
  selected,
  selectedValues,
}: ResolveSingleModeChangeArgs) => {
  const newValue = selectedValues.find((value) => !selected.includes(value));
  return newValue ? [newValue] : [];
};
