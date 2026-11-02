import { describe, expect, it } from 'vite-plus/test';

import { LINE_CHART_SERIES_TONES } from '#ui/components/LineChart/LineChart.constants';

import { getSeriesTone } from './getSeriesTone.util';

describe('getSeriesTone', () => {
  it('keeps a tone the series asks for', () => {
    expect(getSeriesTone({ index: 0, tone: 'warning' })).toBe('warning');
  });

  it('takes the palette tone at the series position', () => {
    expect(
      Array.from({ length: 6 }, (_, index) => getSeriesTone({ index })),
    ).toEqual(['info', 'success', 'warning', 'error', 'secondary', 'neutral']);
  });

  it('starts the palette again after its last tone', () => {
    expect(getSeriesTone({ index: LINE_CHART_SERIES_TONES.length })).toBe(
      'info',
    );
  });
});
