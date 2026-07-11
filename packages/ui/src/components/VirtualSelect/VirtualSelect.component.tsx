import { useClickOutside } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useId, useRef } from 'react';

import type { VirtualSelectProps } from './VirtualSelect.types';

import { useVirtualSelectDropdown, useVirtualSelectTagOverflow } from './hooks';
import {
  resolveVirtualSelectDisplay,
  resolveVirtualSelectOptions,
} from './utils';
import { styles } from './VirtualSelect.stylex';
import { VirtualSelectDropdown } from './VirtualSelectDropdown/VirtualSelectDropdown.component';
import { VirtualSelectHeader } from './VirtualSelectHeader/VirtualSelectHeader.component';

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

  const { effectiveDataState, overflowCount, visibleTags } =
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

  return (
    <div
      ref={containerRef}
      {...stylex.props(
        styles.container,
        shouldFillHeight ? styles.containerFill : undefined,
      )}
    >
      <VirtualSelectHeader
        getValueFromLabel={getValueFromLabel}
        isAlwaysOpen={isAlwaysOpen}
        isBusy={isBusy}
        isOpen={isOpen}
        listboxId={resolvedListboxId}
        mode={mode}
        onChange={onChange}
        onToggle={toggleDropdown}
        overflowCount={overflowCount}
        placeholder={placeholder}
        selected={selected}
        triggerRef={triggerRef}
        visibleTags={visibleTags}
      />
      <VirtualSelectDropdown
        customStylex={customStylex}
        dataState={effectiveDataState}
        getValueFromLabel={getValueFromLabel}
        isAlwaysOpen={isAlwaysOpen}
        isListVisible={isListVisible}
        listboxId={resolvedListboxId}
        listMaxHeight={listMaxHeight}
        mode={mode}
        onChange={onChange}
        onClose={closeDropdown}
        onFetchInitial={onFetchInitial}
        onFetchMore={onFetchMore}
        selected={selected}
        selectedLabels={selectedLabels}
        shouldFillHeight={shouldFillHeight}
      />
    </div>
  );
};
