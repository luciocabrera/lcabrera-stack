import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  subsection: {
    marginBottom: spacing.xl,
  },
  subsectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightMedium,
    marginBottom: spacing.md,
  },
});
