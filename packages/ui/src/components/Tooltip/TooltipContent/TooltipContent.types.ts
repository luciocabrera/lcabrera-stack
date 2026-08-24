import type { ReactNode, Ref } from 'react';

import type { TooltipPlacement } from '../Tooltip.types';

export type TooltipContentProps = {
  readonly anchorName: string;
  readonly arrowOffset?: number;
  readonly children: ReactNode;
  readonly id: string;
  readonly isVisible: boolean;
  readonly placement: TooltipPlacement;
  readonly ref: Ref<HTMLDivElement>;
};
