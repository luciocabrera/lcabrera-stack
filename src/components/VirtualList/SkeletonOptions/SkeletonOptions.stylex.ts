import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
import { skelleton } from '@/design-system/tokens/commons.stylex';

export const styles = stylex.create({
  checkbox: {
    cursor: 'pointer',
    height: '1rem',
    width: '1rem',
  },
  option: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: {
      default: '0',
      ':hover': '0.25rem',
    },
    gap: spacing.sm,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.surfaceSecondary,
    },
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'flex-start',
    position: 'relative', // Anchor for shimmer overlay
    minWidth: 0, // Allow flex children to shrink below content size
  },
  optionDisabled: {
    cursor: 'default',
    pointerEvents: 'none',
  },
});

export const skeletonStyles = { ...skelleton };
