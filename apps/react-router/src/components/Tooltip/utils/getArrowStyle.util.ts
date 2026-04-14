import type { TooltipPlacement } from '../Tooltip.types';

import { styles } from '../Tooltip.stylex';

export const getArrowStyle = (
  placement: TooltipPlacement,
  arrowOffset: number,
) =>
  placement === 'top' || placement === 'bottom'
    ? styles.arrowPositionHorizontal(arrowOffset)
    : styles.arrowPositionVertical(arrowOffset);
