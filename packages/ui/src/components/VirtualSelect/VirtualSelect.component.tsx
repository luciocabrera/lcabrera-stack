import type { SelectFilter } from '@repo/ui/types/filterOperators.types';

import {
  VirtualListConfigProvider,
  VirtualListDataProvider,
} from '@repo/ui/components/VirtualList/contexts';
import { useClickOutside } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useId, useRef } from 'react';

import type { VirtualSelectProps } from './VirtualSelect.types';

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
 * Thin shell over the lifted VirtualList contexts: resolves the option
 * label↔value mapping, owns the dropdown open state, and mounts the Config
 * and Data providers so the Header/Dropdown delegates (and the list itself)
 * consume selectors/actions instead of drilled props. Selection stays
 * parent-owned — list changes exit through `onChange` after being mapped
 * back to option values.
 */
export const VirtualSelect = ({
  customStylex,
  dataState,
  isAlwaysOpen = false,
  isBusy = false,
  listboxId,
  listMaxHeight = '18.75rem',
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

  const { closeDropdown, isListVisible, isOpen, toggleDropdown } =
    useVirtualSelectDropdown({ isAlwaysOpen, isBusy, onOpenChange });

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
    <VirtualListConfigProvider
      hasCheckboxes={isMulti}
      hasSelectAll={isMulti}
      onChange={handleListChange}
      onFetchInitial={onFetchInitial}
      onFetchMore={onFetchMore}
    >
      <VirtualListDataProvider
        dataState={effectiveDataState}
        filter={{ type: 'select', values: selectedLabels }}
        hasSelectAll={isMulti}
        onFetchInitial={onFetchInitial}
      >
        <div
          ref={containerRef}
          {...stylex.props(
            styles.container,
            shouldFillHeight ? styles.containerFill : undefined,
          )}
        >
          <VirtualSelectHeader
            isAlwaysOpen={isAlwaysOpen}
            isBusy={isBusy}
            isOpen={isOpen}
            listboxId={resolvedListboxId}
            mode={mode}
            onToggle={toggleDropdown}
            placeholder={placeholder}
          />
          <VirtualSelectDropdown
            customStylex={customStylex}
            isAlwaysOpen={isAlwaysOpen}
            isListVisible={isListVisible}
            listboxId={resolvedListboxId}
            listMaxHeight={listMaxHeight}
            shouldFillHeight={shouldFillHeight}
          />
        </div>
      </VirtualListDataProvider>
    </VirtualListConfigProvider>
  );
};
