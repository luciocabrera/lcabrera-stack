import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    margin: 0,
  },
  error: {
    color: colors.errorText,
    fontSize: typography.fontSizeSm,
    margin: 0,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightMedium,
  },
  required: {
    color: colors.errorText,
  },
});
