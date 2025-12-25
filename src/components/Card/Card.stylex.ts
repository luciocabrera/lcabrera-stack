import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  easing,
  shadows,
  spacing,
  transitions,
} from '@/design-system/tokens/base.stylex';
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
    containerName: 'card',
    containerType: 'inline-size',
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
    boxShadow: shadows.none,
  },

  lg: {
    boxShadow: shadows.lg,
  },

  md: {
    boxShadow: shadows.md,
  },

  sm: {
    boxShadow: shadows.sm,
  },

  xl: {
    boxShadow: shadows.xl,
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
  },

  hoverable: {
    boxShadow: {
      ':hover': colors.shadowHover,
    },
    cursor: 'pointer',
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
