import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import { VirtualListContent } from '#ui/components/VirtualList';
import { useGetShouldFillHeight } from '#ui/components/VirtualList/contexts/list/selectors';

import { useCloseDropdown } from '../contexts/meta/actions';
import {
  useGetCustomStylex,
  useGetIsAlwaysOpen,
  useGetIsListVisible,
  useGetListboxId,
} from '../contexts/meta/selectors';
import { useVirtualSelectAnchorRef } from '../contexts/useVirtualSelectAnchorRef.hook';
import { useVirtualSelectDropdownPosition } from './useVirtualSelectDropdownPosition.hook';
import { resolveDropdownStyles } from './utils/resolveDropdownStyles.util';
import { HAS_POPOVER_SUPPORT } from './VirtualSelectDropdown.constants';

export const VirtualSelectDropdown = () => {
  const anchorRef = useVirtualSelectAnchorRef();
  const customStylex = useGetCustomStylex();
  const isAlwaysOpen = useGetIsAlwaysOpen();
  const isListVisible = useGetIsListVisible();
  const listboxId = useGetListboxId();
  const shouldFillHeight = useGetShouldFillHeight();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCloseDropdown();

  const isFloating = !isAlwaysOpen;
  const placement = useVirtualSelectDropdownPosition({
    anchorRef,
    dropdownRef,
    isEnabled: isFloating && isListVisible,
    onScrollAway: closeDropdown,
  });

  if (!isListVisible) return;

  return (
    <div
      id={listboxId}
      popover={isFloating && HAS_POPOVER_SUPPORT ? 'manual' : undefined}
      ref={dropdownRef}
      role='listbox'
      {...stylex.props(
        ...resolveDropdownStyles({
          customStylex,
          isAlwaysOpen,
          isFloating,
          placement,
          shouldFillHeight,
        }),
      )}
    >
      <VirtualListContent />
    </div>
  );
};
