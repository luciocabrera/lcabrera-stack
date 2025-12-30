import * as stylex from '@stylexjs/stylex';

import { shadows } from '@/design-system/tokens/base.stylex';
import {
  baseInteractiveStyles,
  colorVariants,
  orientationVariants,
  rippleBase,
  sizeVariants,
} from '@/design-system/tokens/commons.stylex';

/**
 * Button Component Styles
 * Supports multiple variants and sizes
 */

// Button-specific styles
const buttonSpecificStyles = stylex.create({
  button: {
    containerName: 'button',
    cursor: {
      default: 'pointer',
      ':disabled': 'not-allowed',
    },
    opacity: {
      ':disabled': 0.6,
    },
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
  base: {
    ...baseInteractiveStyles.element,
    ...buttonSpecificStyles.button,
    ...rippleBase.ripple,
  },
  color: colorVariants,
  icon: baseInteractiveStyles.icon,
  label: baseInteractiveStyles.label,
  orientation: orientationVariants,
  size: sizeVariants,
  style: styleVariants,
  width: widthVariants,
};
