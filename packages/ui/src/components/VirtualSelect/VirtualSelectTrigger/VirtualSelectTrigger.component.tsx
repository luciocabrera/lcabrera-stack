import { useToggleOption } from '@repo/ui/components/VirtualList/contexts/data/actions';
import { useGetSelectedValues } from '@repo/ui/components/VirtualList/contexts/data/selectors';
import { useRef } from 'react';

import { useToggleDropdown } from '../contexts/meta/actions';
import {
  useGetIsAlwaysOpen,
  useGetIsBusy,
  useGetIsOpen,
  useGetListboxId,
  useGetMode,
  useGetPlaceholder,
} from '../contexts/meta/selectors';
import { useVirtualSelectTagOverflow } from '../hooks';
import { resolveTagOverflow } from '../utils';
import {
  assignTriggerRef,
  getTriggerStyleProps,
  renderChevron,
  renderTriggerContent,
} from './utils';
import { VirtualSelectDivTrigger } from './VirtualSelectDivTrigger/VirtualSelectDivTrigger.component';

/**
 * Combobox trigger: placeholder, single-value label, or tag chips with the
 * "+N more" overflow badge. Fully self-connected (zero props) — display
 * metadata comes from the select meta selectors, the selected labels from
 * the list data store, and interactions dispatch through the
 * toggle-dropdown/toggle-option actions. Owns the trigger ref + the
 * ResizeObserver-driven tag-overflow measurement.
 */
export const VirtualSelectTrigger = () => {
  const triggerRef = useRef<HTMLButtonElement | HTMLDivElement | undefined>(
    undefined,
  );

  const isAlwaysOpen = useGetIsAlwaysOpen();
  const isBusy = useGetIsBusy();
  const isOpen = useGetIsOpen();
  const listboxId = useGetListboxId();
  const mode = useGetMode();
  const placeholder = useGetPlaceholder();
  const selectedLabels = useGetSelectedValues();
  const toggleDropdown = useToggleDropdown();
  const toggleOption = useToggleOption();

  const visibleTagCount = useVirtualSelectTagOverflow({
    mode,
    selected: selectedLabels,
    triggerRef,
  });

  const { overflowCount, visibleTags } = resolveTagOverflow({
    mode,
    selectedLabels,
    visibleTagCount,
  });

  const hasSelection = selectedLabels.length > 0;
  const shouldUseTagButtons = mode === 'multi' && hasSelection;
  const shouldUseDivTrigger = isAlwaysOpen || shouldUseTagButtons;
  const shouldDisableInteraction = isBusy || isAlwaysOpen;
  const content = renderTriggerContent({
    hasSelection,
    mode,
    onRemoveTag: toggleOption,
    overflowCount,
    placeholder,
    selected: selectedLabels,
    visibleTags,
  });
  const chevron = renderChevron({ isAlwaysOpen, isOpen });

  // VirtualSelectDivTrigger owns both div variants (static isAlwaysOpen and
  // interactive tag mode). The <button> branch stays separate for native
  // semantics.
  if (shouldUseDivTrigger) {
    return (
      <VirtualSelectDivTrigger triggerRef={triggerRef}>
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
      onClick={shouldDisableInteraction ? undefined : toggleDropdown}
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
