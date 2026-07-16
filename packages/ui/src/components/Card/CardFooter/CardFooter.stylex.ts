import { spacing } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const cardFooterStyles = stylex.create({
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
});
