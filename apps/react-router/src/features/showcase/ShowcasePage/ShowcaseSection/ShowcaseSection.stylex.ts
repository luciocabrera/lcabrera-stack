import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

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
