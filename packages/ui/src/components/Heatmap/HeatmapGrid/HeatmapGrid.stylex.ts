import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

export const heatmapGridStyles = stylex.create({
  cell: {
    padding: 0,
    position: 'relative',
  },
  link: {
    inset: 0,
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colors.textPrimary}`,
    },
    display: 'block',
    position: 'absolute',
  },
  table: {
    inset: 0,
    borderCollapse: 'collapse',
    position: 'absolute',
    tableLayout: 'fixed',
    height: '100%',
    width: '100%',
  },
});
