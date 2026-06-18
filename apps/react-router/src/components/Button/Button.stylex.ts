import * as stylex from '@stylexjs/stylex';

import { borderRadius, shadows } from '@/design-system/tokens/base.stylex';
import {
  baseInteractiveStyles,
  colorVariants,
  orientationVariants,
  rippleBase,
  skeleton,
  sizeVariants,
  widthVariants,
  overlayStyles,
} from '@/design-system/tokens/commons.stylex';

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
  iconOnly: {
    gap: 0,
    justifyContent: 'center',
  },
  busyState: {
    opacity: {
      ':disabled': 1,
    },
  },
  labelHidden: {
    display: 'none',
  },
});

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

const loadingStyles = stylex.create({
  overlay: {
    borderRadius: borderRadius.md,
    insetBlock: 0,
    insetInline: 0,
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
  iconOnly: buttonSpecificStyles.iconOnly,
  busyState: buttonSpecificStyles.busyState,
  label: baseInteractiveStyles.label,
  labelHidden: buttonSpecificStyles.labelHidden,
  orientation: orientationVariants,
  busyOverlay: [skeleton.loadingOverlay, loadingStyles.overlay],
  busyWave: skeleton.shimmerWave,
  size: sizeVariants,
  style: styleVariants,
  width: widthVariants,
  overlay: overlayStyles,
};
