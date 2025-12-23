import * as stylex from '@stylexjs/stylex';

import { borderRadius, easing, spacing, transitions } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

// Base card styles
const baseStyles = stylex.create({
  card: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.lg,
    borderStyle: 'solid',
    borderWidth: '1px',
    overflow: 'hidden',
    transition: `all ${transitions.normal} ${easing.easeInOut}`,
    backgroundColor: colors.surfacePrimary,
    position: 'relative',
  },

  // Ripple effect base
  rippleBase: {
    backgroundPosition: 'center',
    transition: {
      default: 'background-color 0.8s, background-size 0.8s',
      ':active': 'background-color 0s, background-size 0s',
    },
    backgroundSize: {
      default: '0%',
      ':hover': '15000%',
      ':active': '100%',
    },
  },
});

// Elevation variants
const elevationVariants = stylex.create({
  flat: {
    boxShadow: 'none',
  },

  lg: {
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },

  md: {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },

  sm: {
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },

  xl: {
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
});

// Padding variants
const paddingVariants = stylex.create({
  lg: {
    padding: spacing.lg,
  },

  md: {
    padding: spacing.md,
  },

  none: {
    padding: 0,
  },

  sm: {
    padding: spacing.sm,
  },

  xl: {
    padding: spacing.xl,
  },
});

// Interactive variants
const interactiveVariants = stylex.create({
  clickable: {
    backgroundPosition: 'center',
    backgroundImage: {
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
    },
    boxShadow: {
      ':hover': colors.shadowHover,
    },
    cursor: 'pointer',
    // transform: {
    //   ':hover': 'translateY(-2px)',
    // },
  },

  hoverable: {
    boxShadow: {
      ':hover': colors.shadowHover,
    },
    cursor: 'pointer',
    // transform: {
    //   ':hover': 'translateY(-2px)',
    // },
  },

  static: {},
});

// Color variants
const colorVariants = stylex.create({
  default: {
    borderColor: colors.borderPrimary,
    backgroundColor: colors.surfacePrimary,
  },

  error: {
    borderColor: colors.error,
    backgroundColor: colors.errorBackground,
    color: colors.errorCardText,
  },

  info: {
    borderColor: colors.info,
    backgroundColor: colors.infoBackground,
  },

  primary: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimaryBackground,
    color: colors.brandPrimaryCardText,
  },

  secondary: {
    borderColor: colors.brandSecondary,
    backgroundColor: colors.brandSecondary,
    color: colors.brandSecondaryText,
  },

  success: {
    borderColor: colors.success,
    backgroundColor: colors.successBackground,
    color: colors.successCardText,
  },

  warning: {
    borderColor: colors.warning,
    backgroundColor: colors.warningBackground,
    color: colors.warningCardText,
  },
});

export const cardStyles = {
  base: baseStyles.card,
  color: colorVariants,
  elevation: elevationVariants,
  interactive: interactiveVariants,
  padding: paddingVariants,
  rippleBase: baseStyles.rippleBase,
};
