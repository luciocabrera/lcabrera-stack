import type { ReactNode } from 'react';

export type ArrowOffsetParams = {
  placement: TooltipPlacement;
  tooltipStart: number;
  triggerCenter: number;
};

export type TooltipPlacement = 'bottom' | 'left' | 'right' | 'top';

export type TooltipProps = {
  /** The element that triggers the tooltip on hover/focus */
  children: ReactNode;
  /** Tooltip content — text string or rich content */
  content: ReactNode;
  /** Preferred placement relative to the trigger */
  placement?: TooltipPlacement;
};
