import type { RefObject } from 'react';

import { useCallback, useEffect, useMemo } from 'react';

import { SPACING } from '@/constants/popover.constants';

type UsePopoverPositioningArgs = {
  /** Whether the popover is currently open */
  isOpen: boolean;
  /** ID of the popover element */
  popoverId: string;
  /** Reference to the popover element */
  popoverRef: RefObject<HTMLElement | null>;
  /** Dependencies that trigger recalculation (e.g., content changes) */
  recalculateDeps?: unknown[];
};

/**
 * Custom hook to handle smart popover positioning that:
 * - Centers the popover vertically on the trigger button
 * - Clamps to viewport bounds
 * - Adjusts height dynamically when content changes
 */
export const usePopoverPositioning = ({
  isOpen,
  popoverId,
  popoverRef,
  recalculateDeps = [],
}: UsePopoverPositioningArgs) => {
  // Memoize the stringified recalculateDeps to avoid triggering effects unnecessarily
  const recalculateDepsKey = useMemo(
    () => JSON.stringify(recalculateDeps),
    [recalculateDeps],
  );

  // Reusable positioning calculation
  const applyPositioning = useCallback(() => {
    const popover = popoverRef.current;
    if (!popover) return;

    const triggerButton = document.querySelector<HTMLElement>(
      `[popovertarget="${popoverId}"]`,
    );
    if (!triggerButton) return;

    const buttonRect = triggerButton.getBoundingClientRect();

    // Get intrinsic popover height
    popover.style.maxHeight = 'none';
    const popoverRect = popover.getBoundingClientRect();
    const intrinsicHeight = popoverRect.height;

    // Max height is the full viewport minus top/bottom spacing
    const maxHeight = Math.min(
      intrinsicHeight,
      window.innerHeight - SPACING * 2,
    );

    // Check if popover would go off-screen on the right
    const left = buttonRect.left;
    const rightEdge = left + popoverRect.width;
    const adjustedLeft =
      rightEdge > window.innerWidth
        ? Math.max(SPACING, window.innerWidth - popoverRect.width - SPACING)
        : left;

    // Apply positioning — center popover vertically on the trigger button's center
    popover.style.left = `${adjustedLeft}px`;
    popover.style.maxHeight = `${maxHeight}px`;

    const clampedHeight = Math.min(maxHeight, intrinsicHeight);
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    const idealTop = buttonCenterY - clampedHeight / 2;

    // Clamp to stay within viewport
    const clampedTop = Math.max(
      SPACING,
      Math.min(idealTop, window.innerHeight - SPACING - clampedHeight),
    );
    popover.style.top = `${clampedTop}px`;
    popover.style.bottom = 'auto';

    popover.style.margin = '0';
    popover.style.opacity = '1';
  }, [popoverId, popoverRef]);

  // Calculate and apply positioning when popover opens or content changes
  useEffect(() => {
    if (!isOpen) return;
    applyPositioning();
  }, [isOpen, applyPositioning, recalculateDepsKey]);

  // Reposition on window resize while open
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      applyPositioning();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, applyPositioning]);

  const resetPositioning = useCallback(() => {
    const popover = popoverRef.current;
    if (popover) {
      popover.style.opacity = '0';
    }
  }, [popoverRef]);

  return { resetPositioning };
};
