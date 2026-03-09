import { styles } from './Tooltip.stylex';

export const TRANSITION_DURATION_MS = 150;

// Must match tooltip.arrowSize token in base.stylex.ts
const ARROW_SIZE = 12;
export const HALF_ARROW = ARROW_SIZE / 2;

export const ARROW_STYLES = {
  bottom: styles.arrowBottom,
  left: styles.arrowLeft,
  right: styles.arrowRight,
  top: styles.arrowTop,
} as const;
