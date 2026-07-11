import type { KeyboardEvent } from 'react';

import type { VirtualSelectTriggerProps } from './VirtualSelectTrigger.types';

import {
  assignTriggerRef,
  getTriggerStyleProps,
  handleDivTriggerKeyDown,
  renderChevron,
  renderTriggerContent,
} from './utils';

export const VirtualSelectTrigger = ({
  isAlwaysOpen,
  isBusy = false,
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
  const shouldUseTagButtons = mode === 'multi' && hasSelection;
  const shouldUseDivTrigger = isAlwaysOpen || shouldUseTagButtons;
  const shouldDisableInteraction = isBusy || isAlwaysOpen;
  const content = renderTriggerContent({
    hasSelection,
    mode,
    onRemoveTag,
    overflowCount,
    placeholder,
    selected,
    visibleTags,
  });
  const chevron = renderChevron({ isAlwaysOpen, isOpen });

  // The static (isAlwaysOpen) and interactive div triggers share the same
  // shell — only the interaction props differ, so they are spread
  // conditionally. The <button> branch stays separate for native semantics.
  if (shouldUseDivTrigger) {
    const interactionProps = isAlwaysOpen
      ? undefined
      : {
          'aria-controls': listboxId,
          'aria-disabled': shouldDisableInteraction,
          'aria-expanded': isOpen,
          'aria-haspopup': 'listbox' as const,
          onClick: shouldDisableInteraction ? undefined : onToggle,
          onKeyDown: shouldDisableInteraction
            ? undefined
            : (event: KeyboardEvent<HTMLDivElement>) => {
                handleDivTriggerKeyDown({ event, onToggle });
              },
          role: 'button' as const,
          tabIndex: shouldDisableInteraction ? -1 : 0,
        };

    return (
      <div
        ref={(node) => {
          assignTriggerRef({ node, triggerRef });
        }}
        {...interactionProps}
        {...getTriggerStyleProps({
          isBusy,
          isOpen,
          isStatic: isAlwaysOpen,
          mode,
        })}
      >
        {content}
        {chevron}
      </div>
    );
  }

  return (
    <button
      aria-controls={listboxId}
      aria-disabled={shouldDisableInteraction}
      aria-expanded={isOpen}
      aria-haspopup='listbox'
      disabled={shouldDisableInteraction}
      onClick={shouldDisableInteraction ? undefined : onToggle}
      ref={(node) => {
        assignTriggerRef({ node, triggerRef });
      }}
      type='button'
      {...getTriggerStyleProps({ isBusy, isOpen, mode })}
    >
      {content}
      {chevron}
    </button>
  );
};
