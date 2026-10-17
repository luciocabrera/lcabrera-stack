import {
  borderRadius,
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  card: {
    padding: spacing.md,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.lg,
    borderStyle: 'solid',
    borderWidth: 1,
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  charts: {
    gap: spacing.md,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
});
