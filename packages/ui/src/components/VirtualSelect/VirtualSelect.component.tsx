import type { SelectFilter } from '@repo/ui/types/filterOperators.types';

import {
  VirtualListConfigProvider,
  VirtualListDataProvider,
} from '@repo/ui/components/VirtualList/contexts';
import { LIST_MAX_HEIGHT } from '@repo/ui/components/VirtualList/VirtualList.constants';
import { useClickOutside } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useId, useRef } from 'react';

import type { VirtualSelectProps } from './VirtualSelect.types';

import { VirtualSelectConfigProvider } from './contexts';
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
 * Thin shell over the select contexts: resolves the option label↔value
 * mapping, owns the dropdown open state, and mounts the three providers —
 * VirtualSelectConfig (select metadata for the delegates) plus the lifted
 * VirtualList Config/Data pair — so every delegate consumes selectors and
 * actions instead of drilled props. Selection stays parent-owned: list
 * changes exit through the shell's `onChange` mapping on the list config
 * context.
 */
export const VirtualSelect = ({
  customStylex,
  dataState,
  isAlwaysOpen = false,
  isBusy = false,
  listboxId,
  listMaxHeight = LIST_MAX_HEIGHT,
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
    <VirtualSelectConfigProvider
      customStylex={customStylex}
      isAlwaysOpen={isAlwaysOpen}
      isBusy={isBusy}
      isOpen={isOpen}
      listboxId={resolvedListboxId}
      mode={mode}
      onToggleDropdown={toggleDropdown}
      placeholder={placeholder}
    >
      <VirtualListConfigProvider
        hasCheckboxes={isMulti}
        hasSelectAll={isMulti}
        listMaxHeight={listMaxHeight}
        onChange={handleListChange}
        onFetchInitial={onFetchInitial}
        onFetchMore={onFetchMore}
        shouldFillHeight={shouldFillHeight}
      >
        <VirtualListDataProvider
          dataState={effectiveDataState}
          filter={{ type: 'select', values: selectedLabels }}
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
        </VirtualListDataProvider>
      </VirtualListConfigProvider>
    </VirtualSelectConfigProvider>
  );
};
