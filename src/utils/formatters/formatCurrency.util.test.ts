import { describe, expect, it } from 'vitest';

import { formatCurrency } from './formatCurrency.util';

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    const result = formatCurrency({ value: 1234.56 });
    expect(result).toContain('1,234.56');
    expect(result).toContain('$');
  });

  it('formats with explicit currency code', () => {
    const result = formatCurrency({
      currency: 'EUR',
      locale: 'en-US',
      value: 100,
    });
    expect(result).toContain('100');
    expect(result).toContain('€');
  });

  it('formats negative value', () => {
    const result = formatCurrency({ locale: 'en-US', value: -50 });
    expect(result).toContain('-');
    expect(result).toContain('50');
  });

  it('formats zero', () => {
    const result = formatCurrency({ locale: 'en-US', value: 0 });
    expect(result).toContain('0');
  });

  it('adds space between symbol and number', () => {
    const result = formatCurrency({ locale: 'en-US', value: 29032.37 });
    // The normalized result should have space: e.g. "US$ 29,032.37"
    expect(result).toMatch(/\$\s/);
  });

  it('handles large numbers', () => {
    const result = formatCurrency({ locale: 'en-US', value: 1_000_000 });
    expect(result).toContain('1,000,000');
  });
});
