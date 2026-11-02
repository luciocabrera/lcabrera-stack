import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

export const lineChartDotStyles = stylex.create({
  dot: {
    fill: 'none',
    strokeLinecap: 'round',
    strokeWidth: 8,
    vectorEffect: 'non-scaling-stroke',
  },
  link: {
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colors.borderFocus}`,
    },
    cursor: 'pointer',
  },
});
