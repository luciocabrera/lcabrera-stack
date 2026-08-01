import type { RefObject } from 'react';

import { useEffect, useState } from 'react';

import type { DropdownPlacement } from './VirtualSelectDropdown.types';

import { resolveDropdownPlacement } from './utils/resolveDropdownPlacement.util';
import { DROPDOWN_GAP_PX } from './VirtualSelectDropdown.constants';

type UseVirtualSelectDropdownPositionArgs = {
  readonly anchorRef: RefObject<HTMLDivElement | null>;
  readonly dropdownRef: RefObject<HTMLDivElement | null>;
  readonly isEnabled: boolean;
  readonly onScrollAway: () => void;
};

/**
 * Promotes a floating dropdown into the top layer and keeps it anchored to the
 * trigger.
 *
 * The promotion is the point. As `position: absolute` the list was clipped by
 * every scrolling or `overflow: hidden` ancestor between it and the document —
 * a Form group card, the form's own scroll region, a settings drawer — and no
 * z-index fixes that. This is why the same select looks fine on the showcase
 * page, which has no such ancestor, and is cut off inside a modal form. The
 * top layer sits outside all of them, and unlike a portal it leaves the DOM
 * tree untouched, so the shell's click-outside detection still counts a click
 * inside the list as inside the select.
 *
 * A ResizeObserver drives placement, including the first measurement — its
 * initial callback lands after the effect, so nothing sets state synchronously
 * during it. Scrolling an ancestor **dismisses** the dropdown rather than
 * chasing it: a fixed-position list cannot be re-anchored from a passive
 * listener without reading layout on every frame, and one that lags its
 * trigger reads worse than one that closes.
 */
export const useVirtualSelectDropdownPosition = ({
  anchorRef,
  dropdownRef,
  isEnabled,
  onScrollAway,
}: UseVirtualSelectDropdownPositionArgs) => {
  const [placement, setPlacement] = useState<DropdownPlacement>();

  useEffect(() => {
    const anchorElement = anchorRef.current;
    const dropdownElement = dropdownRef.current;

    if (!isEnabled || !anchorElement || !dropdownElement) return;

    // Must precede any measurement: until it is shown, a popover is
    // `display: none` under the UA stylesheet and measures zero.
    if (
      typeof dropdownElement.showPopover === 'function' &&
      !dropdownElement.matches(':popover-open')
    ) {
      dropdownElement.showPopover();
    }

    const reposition = () => {
      const next = resolveDropdownPlacement({
        anchorRect: anchorElement.getBoundingClientRect(),
        dropdownHeight: dropdownElement.getBoundingClientRect().height,
        gap: DROPDOWN_GAP_PX,
        viewportHeight: globalThis.innerHeight,
      });

      // Keeping the previous object stops an unchanged observation from
      // re-rendering the virtualized list, and stops the observer below from
      // feeding itself.
      setPlacement((current) =>
        current?.left === next.left &&
        current.top === next.top &&
        current.width === next.width
          ? current
          : next,
      );
    };

    // Capture phase: the element that scrolls is an ancestor, and a scroll
    // event does not bubble up from it.
    globalThis.addEventListener('scroll', onScrollAway, {
      capture: true,
      passive: true,
    });

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(reposition);

    // documentElement covers viewport resize; the other two cover the trigger
    // growing (a tag wrapping) and the list growing (a page loading in).
    resizeObserver?.observe(document.documentElement);
    resizeObserver?.observe(anchorElement);
    resizeObserver?.observe(dropdownElement);

    return () => {
      globalThis.removeEventListener('scroll', onScrollAway, { capture: true });
      resizeObserver?.disconnect();
    };
  }, [anchorRef, dropdownRef, isEnabled, onScrollAway]);

  return placement;
};
