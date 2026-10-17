import {
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  heading: {
    margin: 0,
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightSemibold,
  },
  list: {
    margin: 0,
    fontSize: typography.fontSizeSm,
    paddingInlineStart: spacing.lg,
  },
  note: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  section: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  page: {
    padding: spacing.xl,
    gap: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
  },
});
