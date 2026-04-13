import type { TooltipPlacement } from '../Tooltip.types.ts';

import { styles } from '../Tooltip.stylex.ts';

export const getArrowStyle = (
  placement: TooltipPlacement,
  arrowOffset: number,
) =>
  placement === 'top' || placement === 'bottom'
    ? styles.arrowPositionHorizontal(arrowOffset)
    : styles.arrowPositionVertical(arrowOffset);
