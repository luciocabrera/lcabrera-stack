type GetIsAllSelectedArgs = {
  readonly filteredOptions: readonly string[];
  readonly selectedValues: readonly string[];
};

/** Whether every currently visible (filtered) option is selected. */
export const getIsAllSelected = ({
  filteredOptions,
  selectedValues,
}: GetIsAllSelectedArgs) =>
  filteredOptions.length > 0 &&
  filteredOptions.every((option) => selectedValues.includes(option));
