import { spacing, typography } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize2xl,
    fontWeight: typography.fontWeightSemibold,
    marginBottom: spacing.lg,
  },
});
