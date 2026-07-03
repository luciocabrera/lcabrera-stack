import * as stylex from '@stylexjs/stylex';
import { useId, useRef } from 'react';

import type { SelectFilter } from '@/types/filterOperators.types';

import { VirtualList } from '@/components/VirtualList';
import { useClickOutside } from '@/hooks';

import type { VirtualSelectProps } from './VirtualSelect.types';

import { useVirtualSelectDropdown, useVirtualSelectTagOverflow } from './hooks';
import {
  getDropdownStyle,
  resolveVirtualSelectChange,
  resolveVirtualSelectDisplay,
  resolveVirtualSelectOptions,
} from './utils';
import { busyStyles, styles } from './VirtualSelect.stylex';
import { VirtualSelectTrigger } from './VirtualSelectTrigger';

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
  const triggerRef = useRef<HTMLButtonElement | HTMLDivElement | undefined>(
    undefined,
  );

  const generatedListboxId = useId();
  const resolvedListboxId =
    listboxId ?? `virtual-select-listbox-${generatedListboxId}`;

  const { getValueFromLabel, optionEntries, selectedLabels } =
    resolveVirtualSelectOptions({ options, selected });

  const visibleTagCount = useVirtualSelectTagOverflow({
    mode,
    selected,
    triggerRef,
  });

  const { closeDropdown, isListVisible, isOpen, toggleDropdown } =
    useVirtualSelectDropdown({ isAlwaysOpen, isBusy, onOpenChange });

  const { effectiveDataState, isMulti, overflowCount, visibleTags } =
    resolveVirtualSelectDisplay({
      dataState,
      mode,
      optionEntries,
      selected,
      selectedLabels,
      visibleTagCount,
    });

  useClickOutside({
    onClickOutside: closeDropdown,
    ref: containerRef,
  });

  const handleVirtualListChange = (filter?: SelectFilter) => {
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

  const handleRemoveTag = (label: string) => {
    const value = getValueFromLabel(label);
    onChange(selected.filter((v) => v !== value));
  };

  return (
    <div
      ref={containerRef}
      {...stylex.props(
        styles.container,
        shouldFillHeight ? styles.containerFill : undefined,
      )}
    >
      {isBusy && (
        <div {...stylex.props(busyStyles.overlay)} aria-hidden='true'>
          <div {...stylex.props(busyStyles.wave)} />
        </div>
      )}
      <VirtualSelectTrigger
        isAlwaysOpen={isAlwaysOpen}
        isBusy={isBusy}
        isOpen={isOpen}
        listboxId={resolvedListboxId}
        mode={mode}
        onRemoveTag={handleRemoveTag}
        onToggle={toggleDropdown}
        overflowCount={overflowCount}
        placeholder={placeholder}
        selected={selected}
        triggerRef={triggerRef}
        visibleTags={visibleTags}
      />
      {/* Dropdown */}
      {isListVisible && (
        <div
          id={resolvedListboxId}
          role='listbox'
          {...stylex.props(
            styles.dropdownBase,
            getDropdownStyle({ isAlwaysOpen, shouldFillHeight }),
            customStylex,
          )}
        >
          <VirtualList
            dataState={effectiveDataState}
            filter={{ type: 'select', values: [...selectedLabels] }}
            hasCheckboxes={isMulti}
            hasSelectAll={isMulti}
            listMaxHeight={listMaxHeight}
            onChange={handleVirtualListChange}
            onFetchInitial={onFetchInitial}
            onFetchMore={onFetchMore}
            shouldFillHeight={shouldFillHeight}
          />
        </div>
      )}
    </div>
  );
};
