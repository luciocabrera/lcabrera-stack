import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

/**
 * The symbol trails the value rather than leading it: the amount is
 * right-aligned (see `NumericFieldControl`), so a leading symbol would strand
 * itself at the opposite edge of the field from the digits it belongs to.
 */
export const styles = stylex.create({
  symbol: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    insetInlineEnd: spacing.sm,
    pointerEvents: 'none',
    position: 'absolute',
    transform: 'translateY(-50%)',
    zIndex: 1,
    top: '50%',
  },
});
