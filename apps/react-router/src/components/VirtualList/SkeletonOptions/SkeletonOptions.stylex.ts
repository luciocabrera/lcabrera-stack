import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
import { skeleton } from '@/design-system/tokens/commons.stylex';

export const styles = stylex.create({
  option: {
    padding: `${spacing.xxs} ${spacing.sm}`,
    boxSizing: 'border-box',
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    gap: spacing.sm,
    height: '32px',
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: {
      default: colors.surfacePrimary,
      ':nth-child(even)': colors.surfaceStripe,
    },
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'flex-start',
    minHeight: '32px',
    minWidth: 0, // Allow flex children to shrink below content size
  },
  optionDisabled: {
    cursor: 'default',
    pointerEvents: 'none',
  },
});

export const skeletonStyles = {
  placeholderBar: skeleton.placeholderBar,
  shimmerWave: skeleton.shimmerWave,
};
