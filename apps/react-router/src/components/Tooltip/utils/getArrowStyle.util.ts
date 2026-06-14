import type { TooltipPlacement } from '../Tooltip.types';

import { styles } from '../Tooltip.stylex';

type GetArrowStyleArgs = {
  readonly arrowOffset: number;
  readonly placement: TooltipPlacement;
};

export const getArrowStyle = ({ arrowOffset, placement }: GetArrowStyleArgs) =>
  placement === 'top' || placement === 'bottom'
    ? styles.arrowPositionHorizontal(arrowOffset)
    : styles.arrowPositionVertical(arrowOffset);
