import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import {
  baseInteractiveStyles,
  colorVariants,
  orientationVariants,
  rippleBase,
  sizeVariants,
  widthVariants,
} from '@repo/ui/design-system/tokens/commons.stylex';
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  item: {
    containerName: 'toolbarLink',
  },
  itemActive: {
    backgroundColor: colors.brandPrimary,
    color: colors.brandSecondaryText,
    fontWeight: 600,
  },
  itemIconOnly: {
    gap: 0,
    justifyContent: 'center',
  },
  labelHidden: {
    display: 'none',
  },
});

export const linkItemStyles = {
  active: styles.itemActive,
  base: {
    ...baseInteractiveStyles.element,
    ...styles.item,
    ...rippleBase.ripple,
  },
  variant: colorVariants,
  icon: baseInteractiveStyles.icon,
  iconOnly: styles.itemIconOnly,
  label: baseInteractiveStyles.label,
  labelHidden: styles.labelHidden,
  orientation: orientationVariants,
  size: sizeVariants,
  width: widthVariants,
};
