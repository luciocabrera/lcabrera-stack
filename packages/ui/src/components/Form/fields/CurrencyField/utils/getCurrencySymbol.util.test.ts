import { describe, expect, it } from 'vite-plus/test';

import { getCurrencySymbol } from './getCurrencySymbol.util';

describe('getCurrencySymbol', () => {
  it('defaults to the USD symbol when no currency is given', () => {
    expect(getCurrencySymbol({})).toBe('$');
  });

  it('resolves the symbol for a known currency code', () => {
    expect(getCurrencySymbol({ currency: 'EUR' })).toBe('€');
  });

  it('falls back to the code itself for an unknown currency', () => {
    expect(getCurrencySymbol({ currency: 'ZZZ' })).toBe('ZZZ');
  });

  it('returns the same symbol when called repeatedly', () => {
    expect(getCurrencySymbol({ currency: 'GBP' })).toBe('£');
    expect(getCurrencySymbol({ currency: 'GBP' })).toBe('£');
  });

  it('keeps currencies distinct when calls are interleaved', () => {
    expect(getCurrencySymbol({ currency: 'EUR' })).toBe('€');
    expect(getCurrencySymbol({ currency: 'JPY' })).toBe('¥');
    expect(getCurrencySymbol({ currency: 'EUR' })).toBe('€');
    expect(getCurrencySymbol({})).toBe('$');
  });

  it('keeps returning the fallback for a rejected code', () => {
    expect(getCurrencySymbol({ currency: 'ZZZ' })).toBe('ZZZ');
    expect(getCurrencySymbol({ currency: 'ZZZ' })).toBe('ZZZ');
  });
});
