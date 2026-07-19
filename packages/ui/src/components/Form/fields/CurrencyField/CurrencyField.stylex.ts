import { spacing, typography } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  symbol: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    insetInlineStart: spacing.sm,
    pointerEvents: 'none',
    position: 'absolute',
    transform: 'translateY(-50%)',
    zIndex: 1,
    top: '50%',
  },
});
