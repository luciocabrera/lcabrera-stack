import { VirtualListContent } from '@lcabrera/ui/components/VirtualList';
import { useGetShouldFillHeight } from '@lcabrera/ui/components/VirtualList/contexts/list/selectors';
import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import { useCloseDropdown } from '../contexts/meta/actions';
import {
  useGetCustomStylex,
  useGetIsAlwaysOpen,
  useGetIsListVisible,
  useGetListboxId,
} from '../contexts/meta/selectors';
import { useVirtualSelectAnchorRef } from '../contexts/useVirtualSelectAnchorRef.hook';
import { useVirtualSelectDropdownPosition } from './useVirtualSelectDropdownPosition.hook';
import { getDropdownStyle } from './utils/getDropdownStyle.util';
import { HAS_POPOVER_SUPPORT } from './VirtualSelectDropdown.constants';
import { styles } from './VirtualSelectDropdown.stylex';

/**
 * Dropdown slice of VirtualSelect: the positioned listbox shell around the
 * provider-less VirtualListContent. Fully self-connected (zero props) —
 * positioning/visibility come from the select meta selectors and the
 * fill-height flag from the list config store; the list providers and the
 * selection-change mapping are owned by the shell.
 *
 * A trigger-opened dropdown renders in the top layer (`popover`) rather than
 * absolutely, so a scrolling ancestor cannot clip it. `isAlwaysOpen` is the
 * inline variant (Table filter panels) — it stays in normal flow, where there
 * is nothing to escape.
 */
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
        styles.dropdownBase,
        // Ahead of the positioning styles, and that order is load-bearing:
        // last-wins, so a consumer style placed after them can null out
        // `position: fixed` or the computed coordinates. A popover that is not
        // absolutely positioned still sits in the top layer, where it lays out
        // against the initial containing block — i.e. the viewport's top-left
        // corner, detached from its trigger. `customStylex` tunes the surface;
        // the component owns where it goes.
        customStylex,
        getDropdownStyle({ isAlwaysOpen, shouldFillHeight }),
        isFloating && placement === undefined && styles.dropdownUnplaced,
        isFloating &&
          placement !== undefined &&
          styles.dropdownAt(placement.left, placement.top, placement.width),
      )}
    >
      <VirtualListContent />
    </div>
  );
};
