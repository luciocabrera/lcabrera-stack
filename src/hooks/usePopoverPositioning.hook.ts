import type { RefObject } from 'react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ESTIMATED_MAX_HEIGHT,
  OFFSET,
  SPACING,
} from '@/constants/popover.constants';

export type PopoverPositioning = {
  /** Whether positioning has been calculated */
  isPositioned: boolean;
  /** Reset positioning (call when closing) */
  resetPositioning: () => void;
};

export type UsePopoverPositioningArgs = {
  /** Column data type to estimate max height */
  columnDataType?: string;
  /** Whether the column has filter options that could expand the content */
  hasOptions?: boolean;
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
 * - Calculates initial position based on available viewport space
 * - Estimates maximum content height to avoid jumping
 * - Locks position after initial calculation
 * - Adjusts height dynamically when content changes
 */
export const usePopoverPositioning = ({
  columnDataType,
  hasOptions = false,
  isOpen,
  popoverId,
  popoverRef,
  recalculateDeps = [],
}: UsePopoverPositioningArgs): PopoverPositioning => {
  const initialPositionRef = useRef<'above' | 'below' | undefined>(undefined);
  const [isPositioned, setIsPositioned] = useState(false);

  // Memoize the stringified recalculateDeps to avoid triggering effects unnecessarily
  const recalculateDepsKey = useMemo(
    () => JSON.stringify(recalculateDeps),
    [recalculateDeps],
  );

  // Calculate and apply positioning when popover opens
  useEffect(() => {
    if (!isOpen) return;

    const popover = popoverRef.current;
    if (!popover) return;

    const triggerButton = document.querySelector<HTMLElement>(
      `[popovertarget="${popoverId}"]`,
    );
    if (!triggerButton) return;

    const buttonRect = triggerButton.getBoundingClientRect();
    const spaceBelow =
      window.innerHeight - buttonRect.bottom - SPACING - OFFSET;
    const spaceAbove = buttonRect.top - SPACING - OFFSET;

    // Get intrinsic popover height
    popover.style.maxHeight = 'none';
    const popoverRect = popover.getBoundingClientRect();
    const intrinsicHeight = popoverRect.height;

    // Estimate maximum possible height for columns with expandable content
    const estimatedMaxHeight =
      columnDataType === 'string' && hasOptions
        ? Math.max(intrinsicHeight, ESTIMATED_MAX_HEIGHT)
        : intrinsicHeight;

    // Determine positioning based on estimated max height
    const doesFitBelow = estimatedMaxHeight <= spaceBelow;
    const doesFitAbove = estimatedMaxHeight <= spaceAbove;
    const shouldPositionAbove =
      !doesFitBelow && (doesFitAbove || spaceAbove > spaceBelow);

    // Store initial positioning decision if not already set
    initialPositionRef.current ??= shouldPositionAbove ? 'above' : 'below';
    setIsPositioned(true);

    // Use locked position
    const shouldUsePositionAbove = initialPositionRef.current === 'above';

    // Calculate max height to ensure popover stays within viewport
    const maxHeight = shouldUsePositionAbove
      ? Math.min(spaceAbove, intrinsicHeight)
      : Math.min(spaceBelow, intrinsicHeight);

    // Check if popover would go off-screen on the right
    const left = buttonRect.left;
    const rightEdge = left + popoverRect.width;
    const adjustedLeft =
      rightEdge > window.innerWidth
        ? Math.max(SPACING, window.innerWidth - popoverRect.width - SPACING)
        : left;

    // Apply positioning
    popover.style.left = `${adjustedLeft}px`;
    popover.style.maxHeight = `${maxHeight}px`;
    popover.style.overflowY = 'auto';

    if (shouldUsePositionAbove) {
      popover.style.bottom = `${window.innerHeight - buttonRect.top + OFFSET}px`;
      popover.style.top = 'auto';
    } else {
      popover.style.top = `${buttonRect.bottom + OFFSET}px`;
      popover.style.bottom = 'auto';
    }

    popover.style.margin = '0';
    popover.style.opacity = '1';
  }, [
    isOpen,
    popoverId,
    popoverRef,
    columnDataType,
    hasOptions,
    recalculateDepsKey,
  ]);

  const resetPositioning = useCallback(() => {
    initialPositionRef.current = undefined;
    setIsPositioned(false);
  }, []);

  return {
    isPositioned,
    resetPositioning,
  };
};
