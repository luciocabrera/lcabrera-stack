import {
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  header: {
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
  },
  trail: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  title: {
    margin: 0,
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightBold,
  },
});
