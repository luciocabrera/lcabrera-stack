import * as stylex from '@stylexjs/stylex';

import { colors } from '@/design-system/tokens/colors.stylex';
import {
  baseInteractiveStyles,
  colorVariants,
  orientationVariants,
  rippleBase,
  sizeVariants,
  widthVariants,
} from '@/design-system/tokens/commons.stylex';

export const styles = stylex.create({
  item: {
    containerName: 'toolbarLink',
  },

  itemActive: {
    backgroundColor: colors.brandPrimary,
    color: colors.brandPrimaryText,
    fontWeight: 600,
  },
});

export const linkItemStyles = {
  active: styles.itemActive,
  base: {
    ...baseInteractiveStyles.element,
    ...styles.item,
    ...rippleBase.ripple,
  },
  color: colorVariants,
  icon: baseInteractiveStyles.icon,
  label: baseInteractiveStyles.label,
  orientation: orientationVariants,
  size: sizeVariants,
  width: widthVariants,
};
