import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  dashedBody: {
    fill: 'none',
    stroke: 'currentColor',
    strokeDasharray: '6 7',
    strokeLinecap: 'round',
    strokeOpacity: 0.4,
    strokeWidth: 1.6,
  },
  headerCell: {
    fill: 'currentColor',
    fillOpacity: 0.22,
  },
  sheetDetail: {
    fill: 'none',
    stroke: 'currentColor',
    strokeOpacity: 0.5,
    strokeWidth: 1.4,
  },
  sheetFill: {
    fill: 'currentColor',
    fillOpacity: 0.06,
    stroke: 'currentColor',
    strokeOpacity: 0.9,
    strokeWidth: 1.8,
  },
});
