import { describe, expect, it } from 'vite-plus/test';

import { resolveShareRatio } from './resolveShareRatio.util';

describe('resolveShareRatio', () => {
  it('divides the measure by the grand total', () => {
    expect(resolveShareRatio({ denominator: 200, value: 50 })).toBe(0.25);
  });

  it('reads the string a numeric aggregate arrives as', () => {
    expect(resolveShareRatio({ denominator: 200, value: '50' })).toBe(0.25);
  });

  it('refuses an absent denominator rather than producing NaN', () => {
    expect(
      resolveShareRatio({ denominator: undefined, value: 50 }),
    ).toBeUndefined();
  });

  it('refuses a zero denominator rather than producing Infinity', () => {
    expect(resolveShareRatio({ denominator: 0, value: 50 })).toBeUndefined();
  });

  it('refuses a numerator that is not a number', () => {
    expect(
      resolveShareRatio({ denominator: 200, value: 'nonsense' }),
    ).toBeUndefined();
  });

  it('keeps a genuine zero, which is a real share', () => {
    expect(resolveShareRatio({ denominator: 200, value: 0 })).toBe(0);
  });

  it('keeps a negative share rather than clamping it', () => {
    expect(resolveShareRatio({ denominator: 200, value: -50 })).toBe(-0.25);
  });
});
