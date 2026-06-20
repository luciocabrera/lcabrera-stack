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

  if (isAlwaysOpen) {
    return (
      <div
        ref={(node) => {
          assignTriggerRef({ node, triggerRef });
        }}
        {...getTriggerStyleProps({ isBusy, isOpen, isStatic: true, mode })}
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
          assignTriggerRef({ node, triggerRef });
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
