import {
  borderRadius,
  easing,
  shadows,
  spacing,
  transitions,
  typography,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

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
    cursor: 'pointer',
    display: 'inline-flex',
    justifyContent: 'center',
    height: '1.5rem',
    width: '1.5rem',
  },
  dismissButtonDefault: {
    color: colors.textSecondary,
  },
  dismissButtonError: {
    color: colors.errorText,
  },
  dismissButtonInfo: {
    color: colors.infoText,
  },
  dismissButtonPrimary: {
    color: colors.brandPrimaryText,
  },
  dismissButtonSecondary: {
    color: colors.brandSecondaryText,
  },
  dismissButtonSuccess: {
    color: colors.successText,
  },
  dismissButtonWarning: {
    color: colors.warningText,
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
    paddingBlock: spacing.md,
    paddingInline: spacing.md,
    backdropFilter: colors.glassBackdropFilterPrimary,
    backgroundColor: colors.surfacePrimary,
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
    backgroundImage: `linear-gradient(140deg, ${colors.notificationGradientBase} 0%, ${colors.success} 250%)`,
    borderLeftColor: colors.borderPrimary,
  },
  itemSurfaceError: {
    backgroundImage: `linear-gradient(140deg, ${colors.notificationGradientBase} 0%, ${colors.error} 250%)`,
    borderLeftColor: colors.error,
  },
  itemSurfaceInfo: {
    backgroundImage: `linear-gradient(140deg, ${colors.notificationGradientBase} 0%, ${colors.info} 250%)`,
    borderLeftColor: colors.info,
  },
  itemSurfacePrimary: {
    backgroundImage: `linear-gradient(140deg, ${colors.notificationGradientBase} 0%, ${colors.brandPrimary} 250%)`,
    borderLeftColor: colors.brandPrimary,
  },
  itemSurfaceSecondary: {
    backgroundImage: `linear-gradient(140deg, ${colors.notificationGradientBase} 0%, ${colors.brandSecondary} 250%)`,
    borderLeftColor: colors.brandSecondary,
  },
  itemSurfaceSuccess: {
    backgroundImage: `linear-gradient(140deg, ${colors.notificationGradientBase} 0%, ${colors.success} 250%)`,
    borderLeftColor: colors.success,
  },
  itemSurfaceWarning: {
    backgroundImage: `linear-gradient(140deg, ${colors.notificationGradientBase} 0%, ${colors.warning} 250%)`,
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
