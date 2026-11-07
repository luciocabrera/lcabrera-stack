import * as stylex from '@stylexjs/stylex';

import { borderRadius } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

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
  height: (rowHeight: number) => ({
    height: rowHeight,
    maxHeight: rowHeight,
    minHeight: rowHeight,
  }),
  staticLayout: (rowHeight: number) => ({
    alignItems: null,
    display: 'table-row',
    height: rowHeight,
    maxHeight: null,
    minHeight: null,
  }),
  header: {
    padding: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  striped: {
    backgroundColor: {
      default: colors.surfacePrimary,
      ':nth-child(even)': colors.backgroundSecondary,
    },
  },
});
