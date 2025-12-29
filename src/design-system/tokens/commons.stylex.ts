import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  easing,
  spacing,
  transitions,
  typography,
} from './base.stylex';
import { colors } from './colors.stylex';

/**
 * Common reusable styles shared across components
 */

// Base interactive element (button/link) styles
export const baseInteractiveStyles = stylex.create({
  element: {
    alignItems: 'center',
    appearance: 'none',
    borderStyle: 'none',
    borderWidth: '0',
    containerType: 'inline-size',
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightMedium,
    gap: spacing.xs,
    justifyContent: 'center',
    opacity: {
      default: 1,
      ':hover': 0.85,
    },
    outline: {
      ':focus-visible': `2px solid ${colors.borderFocus}`,
    },
    outlineOffset: {
      ':focus-visible': 2,
    },
    overflow: 'hidden',
    position: 'relative',
    textDecoration: 'none',
    transition: `opacity ${transitions.fast} ${easing.easeInOut}`,
    userSelect: 'none',
    width: '100%',
  },

  label: {
    '@container (max-width: 60px)': {
      display: 'none',
    },
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

// Base ripple effect
export const rippleBase = stylex.create({
  ripple: {
    backgroundPosition: 'center',
    transition: {
      default: 'background-size 0.8s, background-image 0.8s',
      ':active': 'background-size 0s, background-image 0s',
    },
    backgroundSize: {
      default: '0%',
      ':hover': '15000%',
      ':active': '100%',
    },
  },
});

// Ripple variants for each color
export const colorVariants = stylex.create({
  error: {
    backgroundColor: colors.error,
    color: colors.errorText,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
  },

  ghost: {
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    color: colors.textPrimary,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
    },
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
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
    },
  },

  primary: {
    backgroundColor: colors.brandPrimary,
    color: colors.brandPrimaryText,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
  },

  secondary: {
    backgroundColor: colors.brandSecondary,
    color: colors.brandSecondaryText,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
  },

  success: {
    backgroundColor: colors.success,
    color: colors.successText,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
  },

  warning: {
    backgroundColor: colors.warning,
    color: colors.warningText,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(0% 0 0 / 0.1) 1%, transparent 1%)`,
    },
  },
});

// Shared size variants for buttons and links
export const sizeVariants = stylex.create({
  lg: {
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
    height: '3rem',
    minHeight: '3rem',
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSizeLg,
  },

  md: {
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    height: '2.5rem',
    minHeight: '2.5rem',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSizeMd,
  },

  sm: {
    paddingBlock: spacing.xs,
    paddingInline: spacing.sm,
    height: '2rem',
    minHeight: '2rem',
    borderRadius: borderRadius.sm,
    fontSize: typography.fontSizeSm,
  },
});

// Orientation variants for buttons and links in toolbars/navs
export const orientationVariants = stylex.create({
  horizontal: {
    justifyContent: 'center',
  },

  vertical: {
    justifyContent: 'flex-start',
  },
});
