import * as stylex from '@stylexjs/stylex';

import { borderRadius } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';
import {
  baseInteractiveStyles,
  colorVariants,
  orientationVariants,
  rippleBase,
  sizeVariants,
  skeleton,
} from '#ui/design-system/tokens/commons.stylex';

const styles = stylex.create({
  item: {
    containerName: 'toolbarLink',
  },
  itemBusy: {
    pointerEvents: 'none',
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

const loadingStyles = stylex.create({
  overlay: {
    borderRadius: borderRadius.md,
    insetBlock: 0,
    insetInline: 0,
  },
});

export const linkItemStyles = {
  active: styles.itemActive,
  base: {
    ...baseInteractiveStyles.element,
    ...styles.item,
    ...rippleBase.ripple,
  },
  busyLink: styles.itemBusy,
  busyOverlay: [skeleton.loadingOverlay, loadingStyles.overlay],
  busyWave: skeleton.shimmerWave,
  variant: colorVariants,
  fullWidth: styles.itemFullWidth,
  icon: baseInteractiveStyles.icon,
  iconOnly: styles.itemIconOnly,
  label: baseInteractiveStyles.label,
  labelHidden: styles.labelHidden,
  orientation: orientationVariants,
  size: sizeVariants,
};
