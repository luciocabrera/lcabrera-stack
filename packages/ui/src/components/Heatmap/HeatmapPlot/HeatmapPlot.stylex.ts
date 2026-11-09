import * as stylex from '@stylexjs/stylex';

export const heatmapPlotStyles = stylex.create({
  box: {
    gridArea: 'plot',
    alignSelf: 'start',
    justifySelf: 'start',
    position: 'relative',
  },
  svg: {
    overflow: 'visible',
    display: 'block',
  },
});
