import * as stylex from '@stylexjs/stylex';

import { colors } from './colors.stylex';

/**
 * Common reusable styles shared across components
 */

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
export const rippleVariants = stylex.create({
  error: {
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, ${colors.errorHover} 1%, ${colors.error} 1%)`,
    },
  },

  ghost: {
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
    },
  },

  outline: {
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
    },
  },

  primary: {
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, ${colors.brandPrimaryHover} 1%, ${colors.brandPrimary} 1%)`,
    },
  },

  secondary: {
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, ${colors.brandSecondaryHover} 1%, ${colors.brandSecondary} 1%)`,
    },
  },

  success: {
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, ${colors.successHover} 1%, ${colors.success} 1%)`,
    },
  },

  warning: {
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, ${colors.warningHover} 1%, ${colors.warning} 1%)`,
    },
  },
});
