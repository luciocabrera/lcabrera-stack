import { describe, expect, it } from 'vite-plus/test';

import { isFiniteNumber } from './is-finite-number.util';

describe('isFiniteNumber', () => {
  it('accepts finite numbers, including zero and negative zero', () => {
    expect(isFiniteNumber(3.5)).toBe(true);
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(-0)).toBe(true);
  });

  it('rejects NaN and the infinities', () => {
    expect(isFiniteNumber(NaN)).toBe(false);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber(-Infinity)).toBe(false);
  });

  it('rejects a numeric string and other non-numbers', () => {
    expect(isFiniteNumber('5')).toBe(false);
    expect(isFiniteNumber(undefined)).toBe(false);
  });
});
