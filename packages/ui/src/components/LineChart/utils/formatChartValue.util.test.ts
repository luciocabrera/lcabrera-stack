import { describe, expect, it } from 'vite-plus/test';

import { formatChartValue } from './formatChartValue.util';

const INVALID_DATE = new Date(Number('NaN'));

describe('formatChartValue', () => {
  it('writes a number as it is', () => {
    expect(formatChartValue(0.25)).toBe('0.25');
  });

  it('writes a date at midnight UTC as its calendar day', () => {
    expect(formatChartValue(new Date('2026-03-04T00:00:00Z'))).toBe(
      '2026-03-04',
    );
  });

  it('adds the UTC time to a date past midnight', () => {
    expect(formatChartValue(new Date('2026-03-04T23:30:00Z'))).toBe(
      '2026-03-04 23:30',
    );
  });

  it('writes an invalid date without throwing', () => {
    expect(formatChartValue(INVALID_DATE)).toBe('Invalid Date');
  });
});
