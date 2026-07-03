import type { SelectFilter } from '@/types/filterOperators.types';

import type { VirtualSelectMode } from '../VirtualSelect.types';

import { resolveSingleModeChange } from './resolveSingleModeChange.util';

export type ResolveVirtualSelectChangeArgs = {
  readonly filter?: SelectFilter;
  readonly getValueFromLabel: (label: string) => string;
  readonly mode: VirtualSelectMode;
  readonly selected: readonly string[];
};

export const resolveVirtualSelectChange = ({
  filter,
  getValueFromLabel,
  mode,
  selected,
}: ResolveVirtualSelectChangeArgs) => {
  const selectedInListLabels = filter?.values ?? [];
  const selectedValues = selectedInListLabels.map((label) =>
    getValueFromLabel(label),
  );

  if (mode === 'single') {
    return {
      nextSelected: resolveSingleModeChange({ selected, selectedValues }),
      shouldCloseDropdown: true,
    };
  }

  return {
    nextSelected: selectedValues,
    shouldCloseDropdown: false,
  };
};
