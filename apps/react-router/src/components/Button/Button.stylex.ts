import * as stylex from "@stylexjs/stylex";

import { shadows } from "@/design-system/tokens/base.stylex";
import {
  baseInteractiveStyles,
  colorVariants,
  orientationVariants,
  rippleBase,
  sizeVariants,
  widthVariants,
} from "@/design-system/tokens/commons.stylex";

const buttonSpecificStyles = stylex.create({
  button: {
    containerName: "button",
    cursor: {
      default: "pointer",
      ":disabled": "not-allowed",
    },
    opacity: {
      ":disabled": 0.6,
    },
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
