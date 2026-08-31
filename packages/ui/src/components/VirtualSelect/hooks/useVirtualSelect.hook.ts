import { useId, useRef } from 'react';

import type { SelectFilter } from '#ui/types/filterOperators.types';

import { useClickOutside } from '#ui/hooks';

import type { VirtualSelectProps } from '../VirtualSelect.types';

import {
  buildFallbackDataState,
  resolveVirtualSelectChange,
  resolveVirtualSelectOptions,
} from '../utils';
import { useVirtualSelectDropdown } from './useVirtualSelectDropdown.hook';

type UseVirtualSelectArgs = {
  readonly dataState: VirtualSelectProps['dataState'];
  readonly isAlwaysOpen: boolean;
  readonly isBusy: boolean;
  readonly isDisabled: boolean;
  readonly listboxId: VirtualSelectProps['listboxId'];
  readonly mode: VirtualSelectProps['mode'];
  readonly onChange: VirtualSelectProps['onChange'];
  readonly onOpenChange: VirtualSelectProps['onOpenChange'];
  readonly options: readonly (
    | NonNullable<VirtualSelectProps['options']>[number]
    | string
  )[];
  readonly selected: VirtualSelectProps['selected'];
};

export const useVirtualSelect = ({
  dataState,
  isAlwaysOpen,
  isBusy,
  isDisabled,
  listboxId,
  mode,
  onChange,
  onOpenChange,
  options,
  selected,
}: UseVirtualSelectArgs) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const generatedListboxId = useId();
  const resolvedListboxId =
    listboxId ?? `virtual-select-listbox-${generatedListboxId}`;

  const { getValueFromLabel, optionEntries, selectedLabels } =
    resolveVirtualSelectOptions({ options, selected });

  const { closeDropdown, isOpen, toggleDropdown } = useVirtualSelectDropdown({
    isAlwaysOpen,
    isInert: isBusy || isDisabled,
    onOpenChange,
  });

  useClickOutside({
    onClickOutside: closeDropdown,
    ref: containerRef,
  });

  const isMulti = mode === 'multi';
  const effectiveDataState = dataState ?? buildFallbackDataState(optionEntries);

  const handleListChange = (filter?: SelectFilter) => {
    const { nextSelected, shouldCloseDropdown } = resolveVirtualSelectChange({
      filter,
      getValueFromLabel,
      mode,
      selected,
    });

    onChange([...nextSelected]);

    if (shouldCloseDropdown) {
      closeDropdown();
    }
  };

  return {
    closeDropdown,
    containerRef,
    effectiveDataState,
    handleListChange,
    isMulti,
    isOpen,
    resolvedListboxId,
    selectedLabels,
    toggleDropdown,
  };
};
