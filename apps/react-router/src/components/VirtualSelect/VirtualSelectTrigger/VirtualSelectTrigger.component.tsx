import type { KeyboardEvent } from 'react';

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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isAlwaysOpen) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      aria-controls={!isAlwaysOpen ? listboxId : undefined}
      aria-expanded={!isAlwaysOpen ? isOpen : undefined}
      aria-haspopup={!isAlwaysOpen ? 'listbox' : undefined}
      onClick={isAlwaysOpen ? undefined : onToggle}
      onKeyDown={handleKeyDown}
      ref={triggerRef}
      role={!isAlwaysOpen ? 'button' : undefined}
      tabIndex={!isAlwaysOpen ? 0 : undefined}
      {...stylex.props(
        styles.trigger,
        isOpen && styles.triggerOpen,
        mode === 'multi' && styles.triggerClamped,
        isAlwaysOpen && styles.triggerStatic,
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
      )}
      {!isAlwaysOpen && (
        <span data-chevron {...stylex.props(styles.chevron(isOpen))} />
      )}
    </div>
  );
};
