import * as stylex from '@stylexjs/stylex';

import { borderRadius } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const lineChartPointLinksStyles = stylex.create({
  item: (left: string, top: string) => ({
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    left,
    top,
  }),
  link: {
    borderRadius: borderRadius.full,
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colors.borderFocus}`,
    },
    display: 'block',
    outlineOffset: '1px',
    pointerEvents: 'auto',
    height: '8px',
    width: '8px',
  },
  list: {
    inset: 0,
    margin: 0,
    padding: 0,
    listStyle: 'none',
    pointerEvents: 'none',
    position: 'absolute',
  },
});
