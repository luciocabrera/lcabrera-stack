import * as stylex from '@stylexjs/stylex';

import type { TooltipContentProps } from './TooltipContent.types';

import { ARROW_STYLES } from './TooltipContent.constants';
import { styles } from './TooltipContent.stylex';
import { getArrowStyle } from './utils/getArrowStyle.util';

/**
 * Anchored popover body for Tooltip (`popover='manual'`, `role='tooltip'`)
 * rendering the placement-aware surface, the geometry-aligned arrow, and the
 * tooltip content. Visibility and arrow offset are owned by the parent.
 */
export const TooltipContent = ({
  anchorName,
  arrowOffset,
  children,
  id,
  isVisible,
  placement,
  ref,
}: TooltipContentProps) => {
  return (
    <div
      id={id}
      popover='manual'
      ref={ref}
      role='tooltip'
      {...stylex.props(
        styles.tooltip(anchorName),
        styles[placement],
        isVisible ? styles.tooltipVisible : undefined,
      )}
    >
      <span
        {...stylex.props(
          styles.arrow,
          ARROW_STYLES[placement],
          arrowOffset !== undefined &&
            getArrowStyle({ arrowOffset, placement }),
        )}
      />
      {children}
    </div>
  );
};
