import {
  borderRadius,
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  notice: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    backgroundColor: colors.warningBackground,
    color: colors.warningText,
    display: 'flex',
    flexDirection: 'column',
  },
  text: {
    margin: 0,
    fontSize: typography.fontSizeSm,
  },
  link: {
    color: colors.warningText,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    width: 'fit-content',
  },
});
