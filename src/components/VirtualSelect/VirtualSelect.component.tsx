import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef, useState } from 'react';

import type { VirtualListDataState } from '@/components/VirtualList';
import type { SelectFilter } from '@/types/filterOperators.types';

import { Tag } from '@/components/Tag';
import { VirtualList } from '@/components/VirtualList';
import { useClickOutside } from '@/hooks';

import type { VirtualSelectProps } from './VirtualSelect.types';

import { countVisibleTags } from './utils';
import { styles } from './VirtualSelect.stylex';

export const VirtualSelect = ({
  customStylex,
  dataState,
  isAlwaysOpen = false,
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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [visibleTagCount, setVisibleTagCount] = useState(selected.length);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleClose = () => {
    setIsOpen(false);
  };

  useClickOutside({
    onClickOutside: handleClose,
    ref: containerRef,
  });

  // Static mode: wrap options in a VirtualListDataState
  const effectiveDataState: VirtualListDataState = dataState ?? {
    data: options,
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
  };

  const handleToggleDropdown = () => {
    setIsOpen((isCurrentlyOpen) => !isCurrentlyOpen);
  };

  const handleVirtualListChange = (filter?: SelectFilter) => {
    const values = filter?.values ?? [];

    if (mode === 'single') {
      // Find the newly added value (not in current selected)
      const newValue = values.find((v) => !selected.includes(v));
      onChange(newValue ? [newValue] : []);
      handleClose();
      return;
    }

    onChange(values);
  };

  const handleRemoveTag = (option: string) => {
    onChange(selected.filter((v) => v !== option));
  };

  const hasSelection = selected.length > 0;
  const isListVisible = isAlwaysOpen ? true : isOpen;

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

  const computedVisibleCount =
    mode === 'multi' && hasSelection ? visibleTagCount : selected.length;
  const overflowCount = selected.length - computedVisibleCount;
  const visibleTags = selected.slice(0, computedVisibleCount);

  return (
    <div
      ref={containerRef}
      {...stylex.props(
        styles.container,
        shouldFillHeight ? styles.containerFill : undefined,
      )}
    >
      {/* Trigger / input area */}
      <div
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        onClick={isAlwaysOpen ? undefined : handleToggleDropdown}
        ref={triggerRef}
        role='combobox'
        tabIndex={isAlwaysOpen ? undefined : 0}
        {...stylex.props(
          styles.trigger,
          isOpen && styles.triggerOpen,
          mode === 'multi' && styles.triggerClamped,
        )}
      >
        {hasSelection ? (
          mode === 'single' ? (
            <span {...stylex.props(styles.triggerLabel)}>{selected[0]}</span>
          ) : (
            <>
              {visibleTags.map((value) => (
                <Tag
                  key={value}
                  label={value}
                  onRemove={() => {
                    handleRemoveTag(value);
                  }}
                />
              ))}
              {overflowCount > 0 && (
                <span data-overflow {...stylex.props(styles.overflowTag)}>
                  +{overflowCount} more
                </span>
              )}
            </>
          )
        ) : (
          <span {...stylex.props(styles.triggerPlaceholder)}>
            {placeholder}
          </span>
        )}
        {!isAlwaysOpen && (
          <span data-chevron {...stylex.props(styles.chevron(isOpen))} />
        )}
      </div>

      {/* Dropdown */}
      {isListVisible && (
        <div
          role='listbox'
          {...stylex.props(
            styles.dropdownBase,
            isAlwaysOpen
              ? shouldFillHeight
                ? styles.dropdownStaticFill
                : styles.dropdownStatic
              : styles.dropdownAbsolute,
            customStylex,
          )}
        >
          <VirtualList
            dataState={effectiveDataState}
            filter={{ type: 'select', values: selected }}
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
