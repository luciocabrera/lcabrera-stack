import {
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  choices: {
    margin: 0,
    padding: 0,
    gap: spacing.md,
    listStyle: 'none',
    display: 'flex',
    flexWrap: 'wrap',
  },
  empty: {
    color: colors.textTertiary,
  },
  misload: {
    color: colors.error,
    fontWeight: typography.fontWeightSemibold,
  },
});
