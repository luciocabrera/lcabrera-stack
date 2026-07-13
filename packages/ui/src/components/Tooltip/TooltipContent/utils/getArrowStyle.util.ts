import type { TooltipPlacement } from '../../Tooltip.types';

import { styles } from '../TooltipContent.stylex';

type GetArrowStyleArgs = {
  readonly arrowOffset: number;
  readonly placement: TooltipPlacement;
};

/**
 * Selects the StyleX dynamic style that positions the tooltip arrow along the
 * placement axis: horizontal for `top`/`bottom`, vertical for `left`/`right`.
 */
export const getArrowStyle = ({ arrowOffset, placement }: GetArrowStyleArgs) =>
  placement === 'top' || placement === 'bottom'
    ? styles.arrowPositionHorizontal(arrowOffset)
    : styles.arrowPositionVertical(arrowOffset);
