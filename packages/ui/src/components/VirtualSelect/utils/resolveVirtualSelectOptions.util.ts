import type { VirtualSelectOption } from '../VirtualSelect.types';

import { toOptionEntry } from './toOptionEntry.util';

export type ResolveVirtualSelectOptionsArgs = {
  readonly options: readonly (string | VirtualSelectOption)[];
  readonly selected: readonly string[];
};

export const resolveVirtualSelectOptions = ({
  options,
  selected,
}: ResolveVirtualSelectOptionsArgs) => {
  const optionEntries = options.map((option) => toOptionEntry(option));

  const labelByValue = new Map(optionEntries.map((o) => [o.value, o.label]));
  const valueByLabel = new Map(optionEntries.map((o) => [o.label, o.value]));

  const getLabelFromValue = (value: string) => labelByValue.get(value) ?? value;
  const getValueFromLabel = (label: string) => valueByLabel.get(label) ?? label;

  const selectedLabels = selected.map((value) => getLabelFromValue(value));

  return {
    getLabelFromValue,
    getValueFromLabel,
    optionEntries,
    selectedLabels,
  };
};
