import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableDrillRowCellStyles = stylex.create({
  /**
   * One line, like every other cell's content: `TableRow` clamps the row to the
   * store's `rowHeight`, so content allowed to wrap is not a taller row — it is
   * a silently clipped one, and `<tbody>`'s declared height stops matching what
   * is painted (ADR-065).
   */
  container: {
    gap: spacing.xs,
    overflow: 'hidden',
    alignItems: 'center',
    display: 'flex',
    fontSize: typography.fontSizeSm,
    whiteSpace: 'nowrap',
    minWidth: 0,
    width: '100%',
  },
  /** A failure is stated, not alarmed — it sits inside one row of a working table. */
  failed: {
    color: colors.errorText,
  },
  /**
   * The hand-off is the one drill row that acts. It is styled as a link and is
   * one, but it is **not** a tab stop — see the component for why.
   */
  link: {
    textDecoration: 'underline',
    color: colors.brandPrimaryCardText,
    cursor: 'pointer',
    fontWeight: typography.fontWeightSemibold,
  },
  /** Loading and an unlinkable shortfall are both secondary to the rows around them. */
  muted: {
    color: colors.textSecondary,
  },
  text: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});
