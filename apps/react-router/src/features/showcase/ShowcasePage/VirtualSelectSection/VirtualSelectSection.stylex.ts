import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  resultText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    marginTop: spacing.xs,
  },
  resultTextCompact: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    marginTop: spacing.xxs,
  },
  selectWrapper: {
    maxWidth: '20rem',
  },
});
