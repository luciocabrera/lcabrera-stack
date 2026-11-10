import { describe, expect, it } from 'vite-plus/test';

import { HEAT_TONES, HEATMAP_LEGEND } from './EvalsHeatmap.constants';

describe('the heatmap legend', () => {
  it('names the four pass-rate bands, then the hatched flaky cell', () => {
    expect(HEATMAP_LEGEND.map(({ label }) => label)).toEqual([
      '90% or more',
      '50% or more',
      'Below 50%',
      'No scored trials',
      'Holds a flaky task',
    ]);
    expect(HEATMAP_LEGEND.at(-1)).toEqual({
      label: 'Holds a flaky task',
      pattern: 'hatch',
    });
  });

  it('tones the bands green, amber, red and neutral', () => {
    expect(HEAT_TONES).toEqual({
      high: 'success',
      low: 'error',
      mid: 'warning',
      none: 'neutral',
    });
  });
});
