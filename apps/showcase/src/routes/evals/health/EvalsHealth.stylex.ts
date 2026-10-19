import {
  borderRadius,
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  card: {
    padding: spacing.lg,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.lg,
    borderStyle: 'solid',
    borderWidth: 1,
    gap: spacing.sm,
    backgroundColor: colors.surfacePrimary,
    display: 'flex',
    flexDirection: 'column',
  },
  facts: {
    margin: 0,
    gap: spacing.xxs,
    display: 'grid',
    gridTemplateColumns: 'max-content 1fr',
  },
  factTerm: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  factValue: {
    margin: 0,
    fontSize: typography.fontSizeSm,
  },
  rateLimit: {
    color: colors.error,
    fontWeight: typography.fontWeightSemibold,
  },
});
