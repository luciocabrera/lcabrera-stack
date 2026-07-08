import { spacing } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  customActions: {
    borderTopColor: colors.borderSecondary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
});
