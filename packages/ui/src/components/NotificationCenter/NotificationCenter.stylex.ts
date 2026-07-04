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
  dismissButtonHover: {
    backgroundColor: colors.hover,
    color: colors.textPrimary,
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
  itemContent: {
    flex: '1 1 auto',
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
  },
  message: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
  },
  stack: {
    gap: spacing.sm,
    display: 'flex',
  },
  stackBottom: {
    flexDirection: 'column-reverse',
  },
  stackTop: {
    flexDirection: 'column',
  },
  title: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    lineHeight: typography.lineHeightTight,
  },
  viewport: {
    inset: 'auto',
    margin: 0,
    padding: 0,
    borderColor: 'transparent',
    borderStyle: 'none',
    borderWidth: 0,
    overflow: 'visible',
    backgroundColor: 'transparent',
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 2000,
  },
  viewportBottomLeft: {
    bottom: spacing.md,
    left: spacing.md,
  },
  viewportBottomRight: {
    bottom: spacing.md,
    right: spacing.md,
  },
  viewportTopLeft: {
    left: spacing.md,
    top: spacing.md,
  },
  viewportTopRight: {
    right: spacing.md,
    top: spacing.md,
  },
});
