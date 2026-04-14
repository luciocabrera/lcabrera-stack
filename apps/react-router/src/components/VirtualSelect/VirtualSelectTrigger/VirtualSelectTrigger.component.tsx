import type { KeyboardEvent, RefObject } from 'react';

import * as stylex from '@stylexjs/stylex';

import { Tag } from '@/components/Tag';

import type { VirtualSelectTriggerProps } from './VirtualSelectTrigger.types';

import { styles } from './VirtualSelectTrigger.stylex';

export const VirtualSelectTrigger = ({
  isAlwaysOpen,
  isOpen,
  listboxId,
  mode,
  onRemoveTag,
  onToggle,
  overflowCount,
  placeholder,
  selected,
  triggerRef,
  visibleTags,
}: VirtualSelectTriggerProps) => {
  const hasSelection = selected.length > 0;
  const usesTagButtons = mode === 'multi' && hasSelection;
  const shouldUseNativeButton = !isAlwaysOpen && !usesTagButtons;

  const content = hasSelection ? (
    mode === 'single' ? (
      <span {...stylex.props(styles.triggerLabel)}>{selected[0]}</span>
    ) : (
      <>
        {visibleTags.map((value) => (
          <Tag
            key={value}
            label={value}
            onRemove={() => {
              onRemoveTag(value);
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
    <span {...stylex.props(styles.triggerPlaceholder)}>{placeholder}</span>
  );

  const chevron = !isAlwaysOpen ? (
    <span data-chevron {...stylex.props(styles.chevron(isOpen))} />
  ) : undefined;

  if (isAlwaysOpen) {
    return (
      <div
        ref={triggerRef as RefObject<HTMLDivElement | null>}
        {...stylex.props(
          styles.trigger,
          isOpen && styles.triggerOpen,
          mode === 'multi' && styles.triggerClamped,
          styles.triggerStatic,
        )}
      >
        {content}
        {chevron}
      </div>
    );
  }

  const handleDivKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  if (!shouldUseNativeButton) {
    return (
      <div
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        onClick={onToggle}
        onKeyDown={handleDivKeyDown}
        ref={triggerRef as RefObject<HTMLDivElement | null>}
        role='button'
        tabIndex={0}
        {...stylex.props(
          styles.trigger,
          isOpen && styles.triggerOpen,
          mode === 'multi' && styles.triggerClamped,
        )}
      >
        {content}
        {chevron}
      </div>
    );
  }

  return (
    <button
      aria-controls={listboxId}
      aria-expanded={isOpen}
      aria-haspopup='listbox'
      onClick={onToggle}
      ref={triggerRef as RefObject<HTMLButtonElement | null>}
      type='button'
      {...stylex.props(
        styles.trigger,
        isOpen && styles.triggerOpen,
        mode === 'multi' && styles.triggerClamped,
      )}
    >
      {content}
      {chevron}
    </button>
  );
};
