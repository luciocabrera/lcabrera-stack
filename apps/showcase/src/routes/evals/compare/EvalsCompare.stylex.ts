import {
  borderRadius,
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  field: {
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
    fontSize: typography.fontSizeSm,
  },
  form: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceSecondary,
    display: 'flex',
    flexWrap: 'wrap',
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
  regressed: {
    color: colors.errorText,
  },
  section: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
});
