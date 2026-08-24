import type { ReactNode } from 'react';

export type ArrowOffsetParams = {
  readonly placement: TooltipPlacement;
  readonly tooltipStart: number;
  readonly triggerCenter: number;
};

export type TooltipPlacement = 'bottom' | 'left' | 'right' | 'top';

export type TooltipProps = {
  readonly children: ReactNode;
  readonly content: ReactNode;
  readonly placement?: TooltipPlacement;
};
