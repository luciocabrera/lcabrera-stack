import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  easing,
  shadows,
  spacing,
  transitions,
  typography,
} from '../../design-system/tokens/base.stylex';
import { colors } from '../../design-system/tokens/colors.stylex';

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
    textDecoration: 'none',
    transition: `opacity ${transitions.fast} ${easing.easeInOut}`,
    alignItems: 'center',
    appearance: 'none',
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    display: 'inline-flex',
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightMedium,
    justifyContent: 'center',
    opacity: { default: 1, ':disabled': 0.6, ':hover': 0.85, },
    position: 'relative',
    userSelect: 'none',
    
  },

  // Base ripple effect
  rippleBase: {
    backgroundPosition: 'center',
    transition: {
      default: 'background-color 0.8s, background-size 0.8s',
      ':disabled': 'none',
      ':active': 'background-color 0s, background-size 0s',
    },
    backgroundColor: {
      ':disabled': 'transparent',
    },
    backgroundImage: {
      ':disabled': 'none',
    },
    backgroundSize: {
      default: '0%',
      ':disabled': '0%',
      ':hover': '15000%',
      ':active': '100%',
    },
  },
});

// Ripple variants for each color
export const rippleVariants = stylex.create({
  error: {
    backgroundColor: {
      ':disabled': 'transparent',
      ':hover': colors.errorHover,
      ':active': colors.error,
    },
    backgroundImage: {
      ':disabled': 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.errorHover} 1%)`,
    },
  },

  ghost: {
    backgroundColor: {
      ':disabled': 'transparent',
      ':hover': colors.hover,
      ':active': colors.active,
    },
    backgroundImage: {
      ':disabled': 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
    },
  },

  outline: {
    backgroundColor: {
      ':disabled': 'transparent',
      ':hover': colors.hover,
      ':active': colors.active,
    },
    backgroundImage: {
      ':disabled': 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
    },
  },

  primary: {
    backgroundColor: {
      ':disabled': 'transparent',
      ':hover': colors.brandPrimaryHover,
      ':active': colors.brandPrimaryActive,
    },
    backgroundImage: {
      ':disabled': 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.brandPrimaryHover} 1%)`,
    },
  },

  secondary: {
    backgroundColor: {
      ':disabled': 'transparent',
      ':hover': colors.brandSecondaryHover,
      ':active': colors.brandSecondaryActive,
    },
    backgroundImage: {
      ':disabled': 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.brandSecondaryHover} 1%)`,
    },
  },

  success: {
    backgroundColor: {
      ':disabled': 'transparent',
      ':hover': colors.successHover,
      ':active': colors.success,
    },
    backgroundImage: {
      ':disabled': 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.successHover} 1%)`,
    },
  },

  warning: {
    backgroundColor: {
      ':disabled': 'transparent',
      ':hover': colors.warningHover,
      ':active': colors.warning,
    },
    backgroundImage: {
      ':disabled': 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.warningHover} 1%)`,
    },
  },
});

// Size variants
export const sizeVariants = stylex.create({
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
export const colorVariants = stylex.create({
  error: {
    backgroundColor: colors.error,
    color: colors.errorText,
  },

  ghost: {
    backgroundColor: 'transparent',
    color: colors.textPrimary,
  },

  outline: {
    borderColor: colors.borderPrimary,
    borderStyle: 'solid',
    borderWidth: '1px',
    backgroundColor: 'transparent',
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
export const styleVariants = stylex.create({
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
export const widthVariants = stylex.create({
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
  ripple: rippleVariants,
  rippleBase: baseStyles.rippleBase,
  size: sizeVariants,
  style: styleVariants,
  width: widthVariants,
};
