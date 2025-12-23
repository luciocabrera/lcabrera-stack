import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
// import { colors } from '@/design-system/tokens/colors.stylex';

export const cardDescriptionStyles = stylex.create({
  description: {
    margin: 0,
    // color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
    marginTop: spacing.xs,
  },
});
