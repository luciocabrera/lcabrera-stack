import type { ReactNode, Ref } from 'react';

import type { TooltipPlacement } from '../Tooltip.types';

export type TooltipContentProps = {
  /** CSS anchor name binding the popover to its trigger */
  readonly anchorName: string;
  /** Arrow offset (px) aligning the arrow to the trigger center, measured on open */
  readonly arrowOffset?: number;
  /** Tooltip body content */
  readonly children: ReactNode;
  /** Popover id targeted by the trigger */
  readonly id: string;
  /** Whether the tooltip is visible (drives the fade/slide transition) */
  readonly isVisible: boolean;
  /** Placement relative to the trigger */
  readonly placement: TooltipPlacement;
  /** Popover div ref used by the parent for show/hide and geometry */
  readonly ref: Ref<HTMLDivElement>;
};
