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
  const content = renderTriggerContent({
    hasSelection,
    mode,
    onRemoveTag,
    overflowCount,
    placeholder,
    selected,
    visibleTags,
  });
  const chevron = renderChevron(isAlwaysOpen, isOpen);

  if (isAlwaysOpen) {
    return (
      <div
        ref={(node) => {
          assignTriggerRef({ triggerRef, node });
        }}
        {...getTriggerStyleProps({ isOpen, mode, isStatic: true })}
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
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        onClick={onToggle}
        onKeyDown={(event) => {
          handleDivTriggerKeyDown(event, onToggle);
        }}
        ref={(node) => {
          assignTriggerRef({ triggerRef, node });
        }}
        role='button'
        tabIndex={0}
        {...getTriggerStyleProps({ isOpen, mode })}
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
      ref={(node) => {
        assignTriggerRef({ triggerRef, node });
      }}
      type='button'
      {...getTriggerStyleProps({ isOpen, mode })}
    >
      {content}
      {chevron}
    </button>
  );
};
