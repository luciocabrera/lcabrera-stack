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
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.errorHover} 1%)`,
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
    backgroundImage: 'none',
  },

  secondary: {
    backgroundImage: 'none',
  },

  success: {
    backgroundImage: 'none',
  },

  warning: {
    backgroundImage: 'none',
  },
});
