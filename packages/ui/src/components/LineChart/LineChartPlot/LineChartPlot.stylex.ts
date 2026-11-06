import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

export const lineChartPlotStyles = stylex.create({
  band: {
    fillOpacity: 0.16,
    stroke: 'none',
  },
  dashed: {
    strokeDasharray: '6 4',
  },
  gridlines: {
    fill: 'none',
    stroke: colors.borderSecondary,
    strokeWidth: 1,
    vectorEffect: 'non-scaling-stroke',
  },
  line: {
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    vectorEffect: 'non-scaling-stroke',
  },
  marker: {
    fill: 'none',
    strokeDasharray: '4 4',
    strokeWidth: 1.5,
    vectorEffect: 'non-scaling-stroke',
  },
});
