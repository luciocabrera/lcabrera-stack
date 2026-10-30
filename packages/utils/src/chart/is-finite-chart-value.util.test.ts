import { describe, expect, it } from 'vite-plus/test';

import { isFiniteChartValue } from './is-finite-chart-value.util';

describe('isFiniteChartValue', () => {
  it('accepts a finite number and a valid date', () => {
    expect(isFiniteChartValue(0)).toBe(true);
    expect(isFiniteChartValue(-2.5)).toBe(true);
    const firstDay = new Date(Date.UTC(2026, 0, 1));

    expect(isFiniteChartValue(firstDay)).toBe(true);
  });

  it('refuses an invalid date, a non-finite number, null, undefined and a string', () => {
    const invalidDate = new Date(Number('NaN'));

    expect(isFiniteChartValue(invalidDate)).toBe(false);
    expect(isFiniteChartValue(Number('NaN'))).toBe(false);
    expect(isFiniteChartValue(Number('Infinity'))).toBe(false);
    expect(isFiniteChartValue(JSON.parse('null'))).toBe(false);
    expect(isFiniteChartValue(undefined)).toBe(false);
    expect(isFiniteChartValue('1')).toBe(false);
  });
});
