import { useRef } from 'react';

import { useToggleOption } from '#ui/components/VirtualList/contexts/data/actions';
import { useGetSelectedValues } from '#ui/components/VirtualList/contexts/data/selectors';

import { useToggleDropdown } from '../../contexts/meta/actions';
import {
  useGetIsAlwaysOpen,
  useGetIsBusy,
  useGetIsOpen,
  useGetListboxId,
  useGetMode,
  useGetPlaceholder,
} from '../../contexts/meta/selectors';
import { useVirtualSelectTagOverflow } from '../../hooks';
import { resolveTagOverflow } from '../../utils';
import { renderChevron, renderTriggerContent } from '../utils';

export const useVirtualSelectTrigger = () => {
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

  return {
    chevron,
    content,
    isBusy,
    isOpen,
    listboxId,
    mode,
    shouldUseDivTrigger,
    toggleDropdown,
    triggerRef,
  };
};
