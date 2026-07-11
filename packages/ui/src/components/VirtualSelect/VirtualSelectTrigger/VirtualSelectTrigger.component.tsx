import type { VirtualSelectTriggerProps } from './VirtualSelectTrigger.types';

import {
  assignTriggerRef,
  getTriggerStyleProps,
  renderChevron,
  renderTriggerContent,
} from './utils';
import { VirtualSelectDivTrigger } from './VirtualSelectDivTrigger/VirtualSelectDivTrigger.component';

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

  // VirtualSelectDivTrigger owns both div variants (static isAlwaysOpen and
  // interactive tag mode). The <button> branch stays separate for native
  // semantics.
  if (shouldUseDivTrigger) {
    return (
      <VirtualSelectDivTrigger
        isAlwaysOpen={isAlwaysOpen}
        isBusy={isBusy}
        isOpen={isOpen}
        listboxId={listboxId}
        mode={mode}
        onToggle={onToggle}
        triggerRef={triggerRef}
      >
        {content}
        {chevron}
      </VirtualSelectDivTrigger>
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
