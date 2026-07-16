import { spacing, typography } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
  },
  description: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  error: {
    margin: 0,
    color: colors.errorText,
    fontSize: typography.fontSizeSm,
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
