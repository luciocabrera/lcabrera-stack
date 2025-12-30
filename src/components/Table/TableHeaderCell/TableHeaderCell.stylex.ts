/* eslint-disable @typescript-eslint/naming-convention */
import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
  zIndex,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

/**
 * Shimmer animation for skeleton loading effect
 */
const shimmerAnimation = stylex.keyframes({
  '0%': { transform: 'translateX(-100%)' },
  '100%': { transform: 'translateX(100%)' },
});

export const tableHeaderCellStyles = stylex.create({
  base: (minWidth?: number | string, width?: number | string) => ({
    flex: '1 1 0%',
    gap: spacing.xs,
    paddingBlock: 'var(--table-padding-block)',
    paddingInline: 'var(--table-padding-inline)',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    color: colors.textSecondary,
    display: 'flex',
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    position: 'relative',
    borderRightColor: colors.borderSecondary,
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    minWidth: minWidth ?? null,
    width: width ?? null,
  }),
  content: {
    flex: '1',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  controls: {
    gap: spacing.xxs,
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
  },
  settingsButton: {
    padding: 0,
    borderRadius: borderRadius.sm,
    borderStyle: 'none',
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    color: {
      default: colors.textTertiary,
      ':hover': colors.textSecondary,
    },
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    height: 20,
    width: 20,
  },
  sortButton: {
    padding: 0,
    borderRadius: borderRadius.sm,
    borderStyle: 'none',
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    color: {
      default: colors.textTertiary,
      ':hover': colors.textSecondary,
    },
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    height: 20,
    width: 20,
  },
  sortButtonActive: {
    color: colors.textPrimary,
  },
  /** Loading overlay container for shimmer effect */
  loadingOverlay: {
    inset: 0,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.hover,
    pointerEvents: 'none',
    position: 'absolute',
  },
  /** Shimmer wave that moves across the overlay */
  shimmerWave: {
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationName: shimmerAnimation,
    animationTimingFunction: 'ease-in-out',
    backgroundImage: `linear-gradient(90deg, transparent 0%, ${colors.surfacePrimary} 50%, transparent 100%)`,
    height: '100%',
    width: '100%',
  },
  sticky: {
    backgroundColor: colors.surfaceSecondary,
    position: 'sticky',
    zIndex: zIndex.sticky,
    top: 0,
  },
});
