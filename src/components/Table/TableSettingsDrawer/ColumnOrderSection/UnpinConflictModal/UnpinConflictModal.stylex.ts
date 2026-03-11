import * as stylex from '@stylexjs/stylex';

import { typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
  },
});
