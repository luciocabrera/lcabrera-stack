import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  easing,
  shadows,
  spacing,
  transitions,
  typography,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

const slideUpFadeIn = stylex.keyframes({
  '0%': {
    opacity: '0',
    transform: 'translateY(12px)',
  },
  '100%': {
    opacity: '1',
    transform: 'translateY(0)',
  },
});

export const styles = stylex.create({
  dismissButton: {
    padding: 0,
    borderColor: 'transparent',
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: 1,
    transition: `background-color ${transitions.fast} ${easing.easeInOut}, color ${transitions.fast} ${easing.easeInOut}`,
    alignItems: 'center',
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    cursor: 'pointer',
    display: 'inline-flex',
    justifyContent: 'center',
    height: '1.5rem',
    width: '1.5rem',
  },
  item: {
    animationDuration: transitions.normal,
    animationFillMode: 'both',
    animationName: slideUpFadeIn,
    animationTimingFunction: easing.easeOut,
    boxSizing: 'border-box',
    pointerEvents: 'auto',
    maxWidth: 'min(24rem, calc(100vw - 2rem))',
    minWidth: 'min(18rem, calc(100vw - 2rem))',
    width: '100%',
  },
  itemBody: {
    gap: spacing.sm,
    alignItems: 'flex-start',
    display: 'flex',
  },
  itemContent: {
    flex: '1 1 auto',
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
  },
  itemSurface: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    boxShadow: shadows.lg,
    borderLeftColor: colors.borderPrimary,
    borderLeftStyle: 'solid',
    borderLeftWidth: '4px',
    width: '100%',
  },
  itemSurfaceHover: {
    transition: `box-shadow ${transitions.fast} ${easing.easeInOut}`,
    boxShadow: {
      ':hover': shadows.xl,
    },
  },
  itemSurfaceDefault: {
    borderLeftColor: colors.borderPrimary,
  },
  itemSurfaceError: {
    borderLeftColor: colors.error,
  },
  itemSurfaceInfo: {
    borderLeftColor: colors.info,
  },
  itemSurfacePrimary: {
    borderLeftColor: colors.brandPrimary,
  },
  itemSurfaceSecondary: {
    borderLeftColor: colors.brandSecondary,
  },
  itemSurfaceSuccess: {
    borderLeftColor: colors.success,
  },
  itemSurfaceWarning: {
    borderLeftColor: colors.warning,
  },
  message: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
  },
  title: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    lineHeight: typography.lineHeightTight,
  },
});
