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
    borderStyle: 'none',
    borderWidth: '0',
    gap: spacing.xs,
    outline: {
      ':focus-visible': `2px solid ${colors.borderFocus}`,
    },
    overflow: 'hidden',
    textDecoration: 'none',
    transition: `opacity ${transitions.fast} ${easing.easeInOut}`,
    alignItems: 'center',
    appearance: 'none',
    containerType: 'inline-size',
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightMedium,
    justifyContent: 'center',
    opacity: {
      default: 1,
      ':hover': 0.85,
    },
    outlineOffset: {
      ':focus-visible': '2px',
    },
    position: 'relative',
    userSelect: 'none',
    width: '100%',
  },

  label: {
    overflow: 'hidden',
    display: {
      default: 'block',
      '@container (max-width: 60px)': 'none',
    },
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
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
    color: colors.errorText,
  },

  ghost: {
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
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
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
    },
    color: colors.textPrimary,
  },

  primary: {
    backgroundColor: colors.brandPrimary,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
    color: colors.brandPrimaryText,
  },

  secondary: {
    backgroundColor: colors.brandSecondary,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
    color: colors.brandSecondaryText,
  },

  success: {
    backgroundColor: colors.success,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
    color: colors.successText,
  },

  warning: {
    backgroundColor: colors.warning,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(0% 0 0 / 0.1) 1%, transparent 1%)`,
    },
    color: colors.warningText,
  },
});

// Shared size variants for buttons and links
export const sizeVariants = stylex.create({
  lg: {
    borderRadius: borderRadius.lg,
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
    fontSize: typography.fontSizeLg,
    height: '3rem',
    minHeight: '3rem',
  },

  md: {
    borderRadius: borderRadius.md,
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    fontSize: typography.fontSizeMd,
    height: '2.5rem',
    minHeight: '2.5rem',
  },

  sm: {
    borderRadius: borderRadius.sm,
    paddingBlock: spacing.xs,
    paddingInline: spacing.sm,
    fontSize: typography.fontSizeSm,
    height: '2rem',
    minHeight: '2rem',
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
