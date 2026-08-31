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

      setPlacement((current) =>
        current?.left === next.left &&
        current.top === next.top &&
        current.width === next.width
          ? current
          : next,
      );
    };

    const handleScrollAway = (event: Event) => {
      const { target } = event;
      if (target instanceof Node && dropdownElement.contains(target)) return;

      onScrollAway();
    };

    globalThis.addEventListener('scroll', handleScrollAway, {
      capture: true,
      passive: true,
    });

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(reposition);

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
