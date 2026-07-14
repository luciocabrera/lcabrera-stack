import { borderRadius } from '@repo/ui/design-system/tokens/base.stylex';
import {
  baseInteractiveStyles,
  colorVariants,
  orientationVariants,
  overlayStyles,
  rippleBase,
  sizeVariants,
  skeleton,
} from '@repo/ui/design-system/tokens/commons.stylex';
import * as stylex from '@stylexjs/stylex';

const buttonSpecificStyles = stylex.create({
  button: {
    containerName: 'button',
    cursor: {
      default: 'pointer',
      ':disabled': 'not-allowed',
    },
    opacity: {
      default: 0.9,
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
  overlayOverwrite: { filter: null },
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
  variant: colorVariants,
  icon: baseInteractiveStyles.icon,
  iconOnly: buttonSpecificStyles.iconOnly,
  busyState: buttonSpecificStyles.busyState,
  label: baseInteractiveStyles.label,
  labelHidden: buttonSpecificStyles.labelHidden,
  orientation: orientationVariants,
  busyOverlay: [skeleton.loadingOverlay, loadingStyles.overlay],
  busyWave: skeleton.shimmerWave,
  overlayOverwrite: buttonSpecificStyles.overlayOverwrite,
  size: sizeVariants,
  width: '100%',
  ...overlayStyles,
};
