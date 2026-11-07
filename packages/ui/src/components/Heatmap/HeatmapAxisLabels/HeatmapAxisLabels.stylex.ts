import * as stylex from '@stylexjs/stylex';

import { typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const heatmapAxisLabelStyles = stylex.create({
  column: (cellSize: string) => ({
    gridArea: 'columns',
    alignItems: 'end',
    gridAutoColumns: cellSize,
    gridAutoFlow: 'column',
    gridTemplateRows: 'max-content',
    maxHeight: '8rem',
  }),
  columnItem: {
    textAlign: 'start',
    transform: 'rotate(180deg)',
    writingMode: 'vertical-rl',
  },
  item: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  link: {
    borderRadius: '2px',
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colors.textPrimary}`,
    },
    color: 'inherit',
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    color: colors.textSecondary,
    display: 'grid',
    fontSize: typography.fontSizeXs,
    lineHeight: 1,
  },
  row: (cellSize: string) => ({
    gridArea: 'rows',
    alignItems: 'center',
    gridAutoRows: cellSize,
    textAlign: 'end',
    maxWidth: '12rem',
  }),
});
