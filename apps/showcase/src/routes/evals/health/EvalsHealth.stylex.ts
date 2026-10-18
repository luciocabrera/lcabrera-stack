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
  heading: {
    margin: 0,
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightSemibold,
  },
  note: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  page: {
    padding: spacing.xl,
    gap: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
  },
  rateLimit: {
    color: colors.error,
    fontWeight: typography.fontWeightSemibold,
  },
});
