import { describe, expect, it } from 'vite-plus/test';

import { formatChartValue } from './formatChartValue.util';

describe('formatChartValue', () => {
  it('writes a number as it is', () => {
    expect(formatChartValue(0.25)).toBe('0.25');
  });

  it('writes a date as its UTC calendar day', () => {
    expect(formatChartValue(new Date('2026-03-04T23:30:00Z'))).toBe(
      '2026-03-04',
    );
  });

  it('writes an invalid date without throwing', () => {
    expect(formatChartValue(new Date(NaN))).toBe('Invalid Date');
  });
});
