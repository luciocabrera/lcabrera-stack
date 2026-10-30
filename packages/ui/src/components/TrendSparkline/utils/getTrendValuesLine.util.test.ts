import { describe, expect, it } from 'vite-plus/test';

import { getTrendValuesLine } from './getTrendValuesLine.util';

describe('getTrendValuesLine', () => {
  it('returns an empty path for no values', () => {
    expect(getTrendValuesLine({ height: 20, values: [], width: 100 })).toBe('');
  });

  it('draws a flat mid-height line across the width for a single value', () => {
    expect(getTrendValuesLine({ height: 20, values: [5], width: 100 })).toBe(
      'M0,10L100,10',
    );
  });

  it('draws a flat mid-height line when every value is identical', () => {
    expect(
      getTrendValuesLine({ height: 20, values: [3, 3, 3], width: 100 }),
    ).toBe('M0,10L50,10L100,10');
  });

  it('maps the lowest value to the bottom and the highest to the top', () => {
    expect(
      getTrendValuesLine({ height: 10, values: [0, 5, 10], width: 100 }),
    ).toBe('M0,10L50,5L100,0');
  });

  it('maps negative values', () => {
    expect(
      getTrendValuesLine({ height: 10, values: [-10, 0, -5], width: 100 }),
    ).toBe('M0,10L50,0L100,5');
  });

  it('scales to a fixed maximum and holds a higher value at the top', () => {
    expect(
      getTrendValuesLine({
        height: 10,
        max: 20,
        values: [0, 10, 40],
        width: 100,
      }),
    ).toBe('M0,10L50,5L100,0');
  });
});
