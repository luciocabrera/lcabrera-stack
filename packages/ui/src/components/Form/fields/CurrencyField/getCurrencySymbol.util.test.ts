import { describe, expect, it } from 'vitest';

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
});
