import { typography } from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  split: {
    color: colors.warning,
    fontWeight: typography.fontWeightSemibold,
  },
});
