import * as stylex from '@stylexjs/stylex';

import { typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

const base = stylex.create({
  text: {
    margin: 0,
    fontFamily: typography.fontFamily,
    lineHeight: typography.lineHeightNormal,
  },
  mono: {
    fontFamily: typography.fontFamilyMono,
  },
  tabular: {
    fontVariantNumeric: 'tabular-nums',
  },
});

const sizeVariants = stylex.create({
  lg: { fontSize: typography.fontSizeLg },
  md: { fontSize: typography.fontSizeMd },
  sm: { fontSize: typography.fontSizeSm },
  xs: { fontSize: typography.fontSizeXs },
});

const toneVariants = stylex.create({
  error: { color: colors.errorText },
  info: { color: colors.infoText },
  primary: { color: colors.textPrimary },
  secondary: { color: colors.textSecondary },
  success: { color: colors.successText },
  tertiary: { color: colors.textTertiary },
  warning: { color: colors.warningText },
});

const weightVariants = stylex.create({
  bold: { fontWeight: typography.fontWeightBold },
  medium: { fontWeight: typography.fontWeightMedium },
  normal: { fontWeight: typography.fontWeightNormal },
  semibold: { fontWeight: typography.fontWeightSemibold },
});

export const styles = {
  mono: base.mono,
  size: sizeVariants,
  tabular: base.tabular,
  text: base.text,
  tone: toneVariants,
  weight: weightVariants,
};
