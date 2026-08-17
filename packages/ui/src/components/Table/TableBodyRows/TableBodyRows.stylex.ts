import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

/**
 * Three grounds for three kinds of row, because a rollup body is read by
 * scanning rather than line by line.
 *
 * A subtotal used to be separable from an ordinary group row only by a heavier
 * font and the word `total` appended to its label — which fails at a glance in
 * a body of hundreds of rows, and fails outright for a group whose key value
 * legitimately ends in that word. Ground is the one difference that survives
 * both.
 *
 * **Colour and weight only.** `TableRow` pins `height`/`minHeight`/`maxHeight`
 * to the store's `rowHeight` and `TableBody` derives `<tbody>`'s height from
 * that same number, so any variant here that changed box metrics would
 * desynchronize the body from its contents. The grand total's rule is a
 * `border-top` under `box-sizing: border-box`, which paints inside the pinned
 * height rather than adding to it — the one property that makes an accounting
 * rule affordable at all (ADR-065).
 */
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
