import { describe, expect, it } from 'vite-plus/test';

import { formatNumber } from './format-number.util';

describe('formatNumber', () => {
  it('formats a number with default locale', () => {
    const result = formatNumber({ value: 1_234_567 });
    expect(result).toBe('1,234,567');
  });

  it('formats with explicit locale', () => {
    const result = formatNumber({ locale: 'en-US', value: 1000 });
    expect(result).toBe('1,000');
  });

  it('formats with minimumFractionDigits', () => {
    const result = formatNumber({ minimumFractionDigits: 2, value: 1.5 });
    expect(result).toBe('1.50');
  });

  it('formats with maximumFractionDigits', () => {
    const result = formatNumber({ maximumFractionDigits: 0, value: 1.9 });
    expect(result).toBe('2');
  });

  it('formats zero', () => {
    const result = formatNumber({ value: 0 });
    expect(result).toBe('0');
  });

  it('formats negative numbers', () => {
    const result = formatNumber({ locale: 'en-US', value: -42 });
    expect(result).toBe('-42');
  });
});
