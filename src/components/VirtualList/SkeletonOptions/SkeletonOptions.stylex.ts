import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { skelleton } from '@/design-system/tokens/commons.stylex';

export const styles = stylex.create({
  option: {
    padding: `${spacing.xs} ${spacing.sm}`,
    gap: spacing.sm,
    overflow: 'hidden',
    alignItems: 'center',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'flex-start',
    minWidth: 0, // Allow flex children to shrink below content size
  },
  optionDisabled: {
    cursor: 'default',
    pointerEvents: 'none',
  },
});

export const skeletonStyles = {
  placeholderBar: skelleton.placeholderBar,
  shimmerWave: skelleton.shimmerWave,
};
