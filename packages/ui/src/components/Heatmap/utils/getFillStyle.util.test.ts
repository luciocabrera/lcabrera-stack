import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

import { heatmapFill } from '#ui/components/Heatmap/Heatmap.stylex';
import { lineChartFill } from '#ui/components/LineChart/LineChart.stylex';

import { getFillStyle } from './getFillStyle.util';

describe('getFillStyle', () => {
  it('uses the empty style for an empty cell', () => {
    expect(stylex.props(getFillStyle({ kind: 'empty' }))).toEqual(
      stylex.props(heatmapFill.empty),
    );
  });

  it('uses the fill of the tone', () => {
    expect(
      stylex.props(getFillStyle({ kind: 'tone', tone: 'success' })),
    ).toEqual(stylex.props(lineChartFill.success));
  });

  it('mixes the sequential fill at the given percent', () => {
    const props = stylex.props(
      getFillStyle({ kind: 'sequential', percent: '40%' }),
    );

    expect(props).toEqual(stylex.props(heatmapFill.sequential('40%')));
    expect(JSON.stringify(props)).toContain('40%');
  });
});
