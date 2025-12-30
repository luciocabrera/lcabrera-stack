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
 * Pulse animation for skeleton loading effect
 */
const pulseAnimation = stylex.keyframes({
  '0%': { opacity: 0.4 },
  '25%': { opacity: 0.6 },
  '50%': { opacity: 0.8 },
  '75%': { opacity: 0.6 },
  '100%': { opacity: 0.4 },
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
  loadingOverlay: {
    animationDuration: '1.2s',
    animationIterationCount: 'infinite',
    animationName: pulseAnimation,
    animationTimingFunction: 'ease-in-out',
    backgroundColor: 'rgba(120, 120, 120, 0.25)',
    borderRadius: borderRadius.sm,
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
  },
  sticky: {
    backgroundColor: colors.surfaceSecondary,
    position: 'sticky',
    zIndex: zIndex.sticky,
    top: 0,
  },
});
