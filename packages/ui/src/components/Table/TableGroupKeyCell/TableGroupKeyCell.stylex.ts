import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableGroupKeyCellStyles = stylex.create({
  /**
   * Brand-tinted rather than `textPrimary`, so a key column reads as structure
   * at a glance instead of as one more data column — the property the retired
   * hierarchy column carried, kept now that the value sits in the consumer's
   * own column beside ordinary data.
   */
  container: {
    gap: spacing.xs,
    overflow: 'hidden',
    alignItems: 'center',
    color: colors.brandPrimaryCardText,
    display: 'flex',
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    // Inherited, never chosen here: this container fills the cell, so the cell's own
    // type-derived alignment would otherwise stop at its edge (#1018).
    justifyContent: 'inherit',
    minWidth: 0,
    width: '100%',
  },
  /** A subtotal states its own level and is read as a total, not as a group. */
  subtotalText: {
    fontWeight: typography.fontWeightBold,
  },
  text: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});
