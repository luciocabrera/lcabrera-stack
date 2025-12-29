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
import {
  rippleBase as sharedRippleBase,
  rippleVariants as sharedRippleVariants,
} from '@/design-system/tokens/commons.stylex';

/**
 * Button Component Styles
 * Supports multiple variants and sizes
 */

// Base button styles
const baseStyles = stylex.create({
  button: {
    borderStyle: 'none',
    borderWidth: '0',
    gap: spacing.xs,
    overflow: 'hidden',
    alignItems: 'center',
    appearance: 'none',
    textDecoration: 'none',
    containerName: 'button',
    containerType: 'inline-size',
    transition: `opacity ${transitions.fast} ${easing.easeInOut}`,
    cursor: { default: 'pointer', ':disabled': 'not-allowed', },
    display: 'inline-flex',
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightMedium,
    justifyContent: 'center',
    opacity: { default: 1, ':disabled': 0.6, ':hover': 0.85, },
    position: 'relative',
    userSelect: 'none',
  },

  buttonLabel: {
    '@container button (max-width: 60px)': {
      display: 'none',
    },
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

// Size variants
const sizeVariants = stylex.create({
  lg: {
    borderRadius: borderRadius.lg,
    paddingInline: spacing.lg,
    fontSize: typography.fontSizeLg,
    height: '3rem',
  },

  md: {
    borderRadius: borderRadius.md,
    paddingInline: spacing.md,
    fontSize: typography.fontSizeMd,
    height: '2.5rem',
  },

  sm: {
    borderRadius: borderRadius.sm,
    paddingInline: spacing.sm,
    fontSize: typography.fontSizeSm,
    height: '2rem',
  },
});

// Color variants
const colorVariants = stylex.create({
  error: {
    backgroundColor: colors.error,
    color: colors.errorText,
  },

  ghost: {
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    color: colors.textPrimary,
  },

  outline: {
    borderColor: colors.borderPrimary,
    borderStyle: 'solid',
    borderWidth: '1px',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    color: colors.textPrimary,
  },

  primary: {
    backgroundColor: colors.brandPrimary,
    color: colors.brandPrimaryText,
  },

  secondary: {
    backgroundColor: colors.brandSecondary,
    color: colors.brandSecondaryText,
  },

  success: {
    backgroundColor: colors.success,
    color: colors.successText,
  },

  warning: {
    backgroundColor: colors.warning,
    color: colors.warningText,
  },
});

// Style variants
const styleVariants = stylex.create({
  elevated: {
    boxShadow: shadows.md,
  },

  flat: {
    boxShadow: shadows.none,
  },

  solid: {
    boxShadow: shadows.sm,
  },
});

// Width variants
const widthVariants = stylex.create({
  auto: {
    width: 'auto',
  },

  full: {
    width: '100%',
  },
});

export const buttonStyles = {
  base: baseStyles.button,
  color: colorVariants,
  label: baseStyles.buttonLabel,
  ripple: sharedRippleVariants,
  rippleBase: sharedRippleBase.ripple,
  size: sizeVariants,
  style: styleVariants,
  width: widthVariants,
};
