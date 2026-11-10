import { describe, expect, it } from 'vite-plus/test';

import { HEAT_TONES, HEATMAP_LEGEND } from './EvalsHeatmap.constants';

describe('the heatmap legend', () => {
  it('names each pass-rate band in the tone its cells take, then the hatch', () => {
    expect(HEATMAP_LEGEND).toEqual([
      { label: '90% or more', tone: HEAT_TONES.high },
      { label: '50% or more', tone: HEAT_TONES.mid },
      { label: 'Below 50%', tone: HEAT_TONES.low },
      { label: 'No scored trials', tone: HEAT_TONES.none },
      { label: 'Holds a flaky task', pattern: 'hatch' },
    ]);
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
