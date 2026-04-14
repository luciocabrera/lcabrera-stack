import * as stylex from '@stylexjs/stylex';
import { useEffect, useId, useRef, useState } from 'react';

import type { VirtualListDataState } from '@/components/VirtualList';
import type { SelectFilter } from '@/types/filterOperators.types';

import { VirtualList } from '@/components/VirtualList';
import { useClickOutside } from '@/hooks';

import type {
  VirtualSelectOption,
  VirtualSelectProps,
} from './VirtualSelect.types';

import { countVisibleTags, getDropdownStyle } from './utils';
import { styles } from './VirtualSelect.stylex';
import { VirtualSelectTrigger } from './VirtualSelectTrigger';

export const VirtualSelect = ({
  customStylex,
  dataState,
  isAlwaysOpen = false,
  listMaxHeight = '18.75rem',
  listboxId,
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
  const triggerRef = useRef<HTMLButtonElement | HTMLDivElement>(null);
  const generatedListboxId = useId();
  const [visibleTagCount, setVisibleTagCount] = useState(selected.length);
  const [isOpen, setIsOpen] = useState(false);
  const resolvedListboxId =
    listboxId ?? `virtual-select-listbox-${generatedListboxId}`;

  // Normalize to { label, value } pairs — plain strings become { label: x, value: x }
  const optionEntries: VirtualSelectOption[] = options.map((o) =>
    typeof o === 'string' ? { label: o, value: o } : o,
  );

  // Map selected values → display labels for VirtualList and Trigger
  const selectedLabels = selected.map(
    (v) => optionEntries.find((o) => o.value === v)?.label ?? v,
  );

  const hasSelection = selected.length > 0;
  const isListVisible = isAlwaysOpen ? true : isOpen;
  const computedVisibleCount =
    mode === 'multi' && hasSelection ? visibleTagCount : selected.length;
  const overflowCount = selected.length - computedVisibleCount;
  const visibleTags = selectedLabels.slice(0, computedVisibleCount);

  // Static mode: wrap option labels in a VirtualListDataState
  const effectiveDataState: VirtualListDataState = dataState ?? {
    data: optionEntries.map((o) => o.label),
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
  };

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Subscribe to trigger size changes via ResizeObserver so tag overflow
  // is recalculated whenever the container resizes (e.g. tags added/removed).
  useEffect(() => {
    const trigger = triggerRef.current;
    if (mode !== 'multi' || !trigger) return;

    const observer = new ResizeObserver(() => {
      setVisibleTagCount(
        countVisibleTags({ totalCount: selected.length, trigger }),
      );
    });
    observer.observe(trigger);

    // Also run immediately for the initial measurement
    setVisibleTagCount(
      countVisibleTags({ totalCount: selected.length, trigger }),
    );

    return () => {
      observer.disconnect();
    };
  }, [mode, selected]);

  const handleClose = () => {
    setIsOpen(false);
  };

  useClickOutside({
    onClickOutside: handleClose,
    ref: containerRef,
  });

  const handleToggleDropdown = () => {
    setIsOpen((isCurrentlyOpen) => !isCurrentlyOpen);
  };

  const handleVirtualListChange = (filter?: SelectFilter) => {
    const selectedInListLabels = filter?.values ?? [];

    // Map display labels back to values before reporting to parent
    const selectedValues = selectedInListLabels.map(
      (label) => optionEntries.find((o) => o.label === label)?.value ?? label,
    );

    if (mode === 'single') {
      // Find the newly added value (not in current selected)
      const newValue = selectedValues.find((v) => !selected.includes(v));
      onChange(newValue ? [newValue] : []);
      handleClose();
      return;
    }

    onChange(selectedValues);
  };

  const handleRemoveTag = (label: string) => {
    const value = optionEntries.find((o) => o.label === label)?.value ?? label;
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
      <VirtualSelectTrigger
        isAlwaysOpen={isAlwaysOpen}
        isOpen={isOpen}
        listboxId={resolvedListboxId}
        mode={mode}
        onRemoveTag={handleRemoveTag}
        onToggle={handleToggleDropdown}
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
          {...stylex.props(
            styles.dropdownBase,
            getDropdownStyle(isAlwaysOpen, shouldFillHeight),
            customStylex,
          )}
        >
          <VirtualList
            dataState={effectiveDataState}
            filter={{ type: 'select', values: selectedLabels }}
            hasCheckboxes={mode === 'multi'}
            hasSelectAll={mode === 'multi'}
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
