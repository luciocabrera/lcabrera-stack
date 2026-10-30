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

  it('scales from the finite values and breaks the line at a non-finite one', () => {
    const line = getTrendValuesLine({
      height: 10,
      values: [0, Number('NaN'), 10, 5, Number('Infinity'), 0],
      width: 100,
    });

    expect(line).toBe('M0,10L0,10M40,0L60,5M100,10L100,10');
    expect(line).not.toContain('NaN');
  });

  it('falls back to a one-unit scale above the lowest value when the maximum is below it', () => {
    expect(
      getTrendValuesLine({ height: 10, max: -1, values: [0, 3], width: 100 }),
    ).toBe('M0,10L100,0');
  });

  it('sets a flat series on the baseline when the maximum equals it', () => {
    expect(
      getTrendValuesLine({ height: 10, max: 2, values: [2, 2], width: 100 }),
    ).toBe('M0,10L100,10');
  });
});
