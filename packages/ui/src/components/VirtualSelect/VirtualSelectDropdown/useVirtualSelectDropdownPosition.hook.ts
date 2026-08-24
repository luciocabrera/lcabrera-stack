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
 * As `position: absolute` the list was clipped by every scrolling or `overflow: hidden`
 * ancestor between it and the document — a Form group card, the form's own scroll region,
 * a settings drawer — and no z-index fixes that.
 * Scrolling an **ancestor** dismisses the dropdown rather than chasing it: a
 * fixed-position list cannot be re-anchored from a passive listener without reading layout
 * on every frame, and one that lags its trigger reads worse than one that closes.
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

    const handleScrollAway = (event: Event) => {
      // Non-bubbling removes the bubble phase only: a capture listener on
      // `window` is still on the path of a scroll from EVERY element, and the
      // option list is itself a scroll container. Without this guard, scrolling
      // the list closes the dropdown on the first wheel tick, which is what
      // made an option below the fold unreachable.
      const { target } = event;
      if (target instanceof Node && dropdownElement.contains(target)) return;

      onScrollAway();
    };

    // Capture phase: the element that scrolls is an ancestor, and a scroll
    // event does not bubble up from it.
    globalThis.addEventListener('scroll', handleScrollAway, {
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
      globalThis.removeEventListener('scroll', handleScrollAway, {
        capture: true,
      });
      resizeObserver?.disconnect();
    };
  }, [anchorRef, dropdownRef, isEnabled, onScrollAway]);

  return placement;
};
