import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import {
  baseInteractiveStyles,
  colorVariants,
  orientationVariants,
  rippleBase,
  sizeVariants,
} from '@repo/ui/design-system/tokens/commons.stylex';
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  item: {
    containerName: 'toolbarLink',
  },
  itemFullWidth: {
    width: '100%',
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
  fullWidth: styles.itemFullWidth,
  icon: baseInteractiveStyles.icon,
  iconOnly: styles.itemIconOnly,
  label: baseInteractiveStyles.label,
  labelHidden: styles.labelHidden,
  orientation: orientationVariants,
  size: sizeVariants,
};
