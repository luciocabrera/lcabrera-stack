import type { TooltipPlacement } from './Tooltip.types';

import { styles } from './Tooltip.stylex';

export const TRANSITION_DURATION_MS = 150;

export const POSITION_AREA: Record<TooltipPlacement, string> = {
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  top: 'top',
};

export const ARROW_STYLES = {
  bottom: styles.arrowBottom,
  left: styles.arrowLeft,
  right: styles.arrowRight,
  top: styles.arrowTop,
} as const;
