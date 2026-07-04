import * as stylex from '@stylexjs/stylex';

import { spacing } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import { skeleton } from '@repo/ui/design-system/tokens/commons.stylex';

export const styles = stylex.create({
  option: {
    padding: `${spacing.xxs} ${spacing.sm}`,
    gap: spacing.sm,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: {
      default: colors.surfacePrimary,
      ':nth-child(even)': colors.surfaceStripe,
    },
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'flex-start',
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    height: '32px',
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
