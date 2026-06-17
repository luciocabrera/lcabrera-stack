import type { VirtualSelectTriggerProps } from './VirtualSelectTrigger.types';

import {
  assignTriggerRef,
  getTriggerStyleProps,
  handleDivTriggerKeyDown,
  renderChevron,
  renderTriggerContent,
} from './utils';

export const VirtualSelectTrigger = ({
  isBusy = false,
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

  if (isAlwaysOpen) {
    return (
      <div
        ref={(node) => {
          assignTriggerRef({ triggerRef, node });
        }}
        {...getTriggerStyleProps({ isBusy, isOpen, mode, isStatic: true })}
      >
        {content}
        {chevron}
      </div>
    );
  }

  if (shouldUseDivTrigger) {
    return (
      <div
        aria-controls={listboxId}
        aria-disabled={shouldDisableInteraction}
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        ref={(node) => {
          assignTriggerRef({ triggerRef, node });
        }}
        role='button'
        tabIndex={shouldDisableInteraction ? -1 : 0}
        {...getTriggerStyleProps({ isBusy, isOpen, mode })}
        onClick={shouldDisableInteraction ? undefined : onToggle}
        onKeyDown={
          shouldDisableInteraction
            ? undefined
            : (event) => {
                handleDivTriggerKeyDown({ event, onToggle });
              }
        }
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
        assignTriggerRef({ triggerRef, node });
      }}
      type='button'
      {...getTriggerStyleProps({ isBusy, isOpen, mode })}
    >
      {content}
      {chevron}
    </button>
  );
};
