import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableBodyRowsStyles = stylex.create({
  /**
   * The deepest register, and the reason it is a rule rather than a fourth
   * tint: a grand total is the end of the table, and every ledger says so with
   * a line above the number rather than with another shade.
   */
  grandTotalRow: {
    backgroundColor: colors.brandPrimaryBackground,
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '2px',
  },
  /**
   * A group row is tinted rather than striped: striping alternates by position
   * and would put two group rows at different shades, which reads as a
   * difference in kind where there is none.
   */
  groupRow: {
    backgroundColor: colors.surfaceSecondary,
  },
  /** Brand-tinted, so a total is a different kind of row before it is read. */
  subtotalRow: {
    backgroundColor: colors.brandPrimaryBackground,
  },
});
