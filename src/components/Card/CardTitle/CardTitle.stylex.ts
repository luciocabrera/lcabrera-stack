import * as stylex from '@stylexjs/stylex';

import { typography } from '@/design-system/tokens/base.stylex';
// import { colors } from '@/design-system/tokens/colors.stylex';

export const cardTitleStyles = stylex.create({
  title: {
    margin: 0,
    // color: colors.textPrimary,
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightSemibold,
  },
});
