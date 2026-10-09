import {
  borderRadius,
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  banner: {
    margin: 0,
    padding: spacing.md,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: 1,
    backgroundColor: colors.errorBackground,
    color: colors.errorText,
  },
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
  grid: {
    gap: spacing.lg,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  },
  page: {
    padding: spacing.xl,
    gap: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
  },
  suiteName: {
    margin: 0,
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightSemibold,
  },
  title: {
    margin: 0,
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightBold,
  },
});
