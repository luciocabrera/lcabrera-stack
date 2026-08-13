import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableBodyRowsStyles = stylex.create({
  /**
   * A group row is tinted rather than striped: striping alternates by position
   * and would put two group rows at different shades, which reads as a
   * difference in kind where there is none.
   */
  groupRow: {
    backgroundColor: colors.surfaceSecondary,
  },
});
