import {
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

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
