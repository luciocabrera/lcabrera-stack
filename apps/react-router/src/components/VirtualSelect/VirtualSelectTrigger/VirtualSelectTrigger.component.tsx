import type { KeyboardEvent, ReactNode } from 'react';

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
  const shouldUseDivTrigger = isAlwaysOpen || usesTagButtons;

  const setDivRef = (node: HTMLDivElement | null) => {
    triggerRef.current = node;
  };

  const setButtonRef = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;
  };

  let content: ReactNode;

  if (!hasSelection) {
    content = (
      <span {...stylex.props(styles.triggerPlaceholder)}>{placeholder}</span>
    );
  } else if (mode === 'single') {
    content = (
      <span {...stylex.props(styles.triggerLabel)}>
        {visibleTags[0] ?? selected[0]}
      </span>
    );
  } else {
    content = (
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
    );
  }

  const chevron = isAlwaysOpen ? undefined : (
    <span data-chevron {...stylex.props(styles.chevron(isOpen))} />
  );

  if (isAlwaysOpen) {
    return (
      <div
        ref={setDivRef}
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

  if (shouldUseDivTrigger) {
    return (
      <div
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        onClick={onToggle}
        onKeyDown={handleDivKeyDown}
        ref={setDivRef}
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
      ref={setButtonRef}
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
