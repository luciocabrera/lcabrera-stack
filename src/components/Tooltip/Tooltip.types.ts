import type { ReactNode } from 'react';

export type ArrowOffsetParams = {
  readonly placement: TooltipPlacement;
  readonly tooltipStart: number;
  readonly triggerCenter: number;
};

export type TooltipPlacement = 'bottom' | 'left' | 'right' | 'top';

export type TooltipProps = {
  /** The element that triggers the tooltip on hover/focus */
  readonly children: ReactNode;
  /** Tooltip content — text string or rich content */
  readonly content: ReactNode;
  /** Preferred placement relative to the trigger */
  readonly placement?: TooltipPlacement;
};
