import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  easing,
  shadows,
  spacing,
  transitions,
  typography,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

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
    borderColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
    color: colors.textSecondary,
    backgroundColor: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '1.5rem',
    width: '1.5rem',
    padding: 0,
    transition: `background-color ${transitions.fast} ${easing.easeInOut}, color ${transitions.fast} ${easing.easeInOut}`,
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
    maxWidth: 'min(24rem, calc(100vw - 2rem))',
    minWidth: 'min(18rem, calc(100vw - 2rem))',
    pointerEvents: 'auto',
    width: '100%',
  },
  itemBody: {
    display: 'flex',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  itemSurface: {
    backgroundColor: colors.surfaceElevated,
    borderLeftColor: colors.borderPrimary,
    borderLeftStyle: 'solid',
    borderLeftWidth: '4px',
    borderRadius: borderRadius.lg,
    boxShadow: shadows.lg,
    overflow: 'hidden',
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
    display: 'flex',
    flex: '1 1 auto',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
    margin: 0,
  },
  stack: {
    display: 'flex',
    gap: spacing.sm,
  },
  stackBottom: {
    flexDirection: 'column-reverse',
  },
  stackTop: {
    flexDirection: 'column',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    lineHeight: typography.lineHeightTight,
    margin: 0,
  },
  viewport: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderStyle: 'none',
    borderWidth: 0,
    inset: 'auto',
    margin: 0,
    overflow: 'visible',
    padding: 0,
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
