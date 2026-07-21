import { borderRadius } from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const tableRowStyles = stylex.create({
  base: {
    alignItems: 'center',
    backgroundColor: colors.surfacePrimary,
    display: 'flex',
    borderBottomColor: colors.borderSecondary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    width: '100%',
  },
  /**
   * Row height comes from the meta store's `rowHeight`, never a literal.
   * `TableBody` sizes `<tbody>` as `totalRows × rowHeight` and derives the
   * virtualization spacers from the same number, so a row painted at any
   * other height desynchronizes the body from its contents. Both `minHeight`
   * and `maxHeight` are pinned because the flex row would otherwise grow to
   * fit tall cell content and break that identity.
   */
  height: (rowHeight: number) => ({
    height: rowHeight,
    maxHeight: rowHeight,
    minHeight: rowHeight,
  }),
  header: {
    padding: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  striped: {
    backgroundColor: { ':nth-child(even)': colors.backgroundSecondary },
  },
});
