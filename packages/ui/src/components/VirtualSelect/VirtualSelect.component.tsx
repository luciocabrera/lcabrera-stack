import type { SelectFilter } from '@repo/ui/types/filterOperators.types';

import { useClickOutside } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useId, useRef } from 'react';

import type { VirtualSelectProps } from './VirtualSelect.types';

import { VirtualSelectProvider } from './contexts';
import { useVirtualSelectDropdown } from './hooks';
import {
  buildFallbackDataState,
  resolveVirtualSelectChange,
  resolveVirtualSelectOptions,
} from './utils';
import { styles } from './VirtualSelect.stylex';
import { VirtualSelectDropdown } from './VirtualSelectDropdown/VirtualSelectDropdown.component';
import { VirtualSelectHeader } from './VirtualSelectHeader/VirtualSelectHeader.component';

/**
 * Thin shell over the select context: resolves the option label↔value mapping,
 * owns the dropdown open state, and mounts the single VirtualSelectProvider —
 * which provides the select metadata and composes the lifted VirtualListProvider
 * so every delegate consumes selectors and actions instead of drilled props.
 * Selection stays parent-owned: list changes exit through the shell's `onChange`
 * mapping passed on the `listState` group.
 */
export const VirtualSelect = ({
  customStylex,
  dataState,
  isAlwaysOpen = false,
  isBusy = false,
  listboxId,
  listMaxHeight,
  mode,
  onChange,
  onFetchInitial,
  onFetchMore,
  onOpenChange,
  options = [],
  placeholder = 'Select...',
  selected,
  shouldFillHeight = false,
}: VirtualSelectProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const generatedListboxId = useId();
  const resolvedListboxId =
    listboxId ?? `virtual-select-listbox-${generatedListboxId}`;

  const { getValueFromLabel, optionEntries, selectedLabels } =
    resolveVirtualSelectOptions({ options, selected });

  const { closeDropdown, isOpen, toggleDropdown } = useVirtualSelectDropdown({
    isAlwaysOpen,
    isBusy,
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

  return (
    <VirtualSelectProvider
      dataState={effectiveDataState}
      filter={{ type: 'select', values: selectedLabels }}
      listState={{
        hasCheckboxes: isMulti,
        hasSelectAll: isMulti,
        listMaxHeight,
        onChange: handleListChange,
        onFetchInitial,
        onFetchMore,
        shouldFillHeight,
      }}
      metaState={{
        customStylex,
        isAlwaysOpen,
        isBusy,
        isOpen,
        listboxId: resolvedListboxId,
        mode,
        onToggleDropdown: toggleDropdown,
        placeholder,
      }}
    >
      <div
        ref={containerRef}
        {...stylex.props(
          styles.container,
          shouldFillHeight ? styles.containerFill : undefined,
        )}
      >
        <VirtualSelectHeader />
        <VirtualSelectDropdown />
      </div>
    </VirtualSelectProvider>
  );
};
