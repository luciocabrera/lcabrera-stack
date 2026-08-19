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
    // `50 / undefined` is `NaN`, which passes a `typeof === "number"` check and
    // formats as `NaN%`.
    expect(
      resolveShareRatio({ denominator: undefined, value: 50 }),
    ).toBeUndefined();
  });

  it('refuses a zero denominator rather than producing Infinity', () => {
    // `50 / 0` is `Infinity`, which formats as `∞%`.
    expect(resolveShareRatio({ denominator: 0, value: 50 })).toBeUndefined();
  });

  it('refuses a numerator that is not a number', () => {
    expect(
      resolveShareRatio({ denominator: 200, value: 'nonsense' }),
    ).toBeUndefined();
  });

  it('keeps a genuine zero, which is a real share', () => {
    // Zero is a measured answer — the group contributed nothing — and must not
    // be confused with the absences above.
    expect(resolveShareRatio({ denominator: 200, value: 0 })).toBe(0);
  });

  it('keeps a negative share rather than clamping it', () => {
    // A negative measure against a positive total is a real state; clamping
    // here would make the number disagree with the value beside it.
    expect(resolveShareRatio({ denominator: 200, value: -50 })).toBe(-0.25);
  });
});
