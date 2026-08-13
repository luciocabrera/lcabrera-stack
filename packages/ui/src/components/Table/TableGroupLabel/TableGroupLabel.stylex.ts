import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableGroupLabelStyles = stylex.create({
  container: {
    gap: spacing.xs,
    overflow: 'hidden',
    alignItems: 'center',
    color: colors.textPrimary,
    display: 'flex',
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    minWidth: 0,
    width: '100%',
  },
  count: {
    color: colors.textSecondary,
    flexShrink: 0,
    fontWeight: typography.fontWeightNormal,
  },
  icon: {
    alignItems: 'center',
    color: colors.textSecondary,
    display: 'inline-flex',
    flexShrink: 0,
  },
  /**
   * Depth as padding rather than as a margin or a nested box: padding leaves
   * the flex line intact, so the label still ellipsizes into whatever width is
   * left rather than pushing the count out of the cell.
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
