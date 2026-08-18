import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableGroupLabelStyles = stylex.create({
  /**
   * Brand-tinted rather than `textPrimary`, so the hierarchy column reads as
   * structure at a glance instead of as one more data column.
   * `brandPrimaryCardText` is the token tuned to sit on a tinted card, which is
   * what every group-row ground is — the subtotal band included.
   */
  container: {
    gap: spacing.xs,
    overflow: 'hidden',
    alignItems: 'center',
    color: colors.brandPrimaryCardText,
    display: 'flex',
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    minWidth: 0,
    width: '100%',
  },
  /**
   * Depth as padding rather than as a margin or a nested box: padding leaves
   * the flex line intact, so the label ellipsizes into whatever width is left
   * rather than overflowing the cell.
   */
  indent: (indentPx: number) => ({
    paddingInlineStart: `${indentPx}px`,
  }),
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
