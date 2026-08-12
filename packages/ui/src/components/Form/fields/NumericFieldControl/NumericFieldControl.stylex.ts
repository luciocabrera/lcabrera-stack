import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  /**
   * Numbers read right-aligned so digit places line up down a column, matching
   * how the Table renders its numeric cells (`tableBodyCellStyles.alignRight`).
   * That puts the digits flush against the spin buttons, which sit at the
   * content-box edge — hence the margin, which padding cannot supply (padding
   * moves the buttons along with the text).
   */
  input: {
    textAlign: 'right',
    '::-webkit-inner-spin-button': {
      marginInlineStart: spacing.xs,
    },
  },
  /** Reserves the trailing room the adornment is absolutely positioned into. */
  inputWithAdornment: {
    paddingInlineEnd: '1.75rem',
  },
});
