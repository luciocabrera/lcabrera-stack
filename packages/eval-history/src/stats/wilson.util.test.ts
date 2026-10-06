import { describe, expect, it } from 'vite-plus/test';

import { wilson } from './wilson.util.ts';

const AT_95 = { minN: 6, z: 1.96 };

describe('wilson', () => {
  it.each([
    { k: 0, lower: 0, n: 10, rate: 0, upper: 0.2775 },
    { k: 5, lower: 0.2366, n: 10, rate: 0.5, upper: 0.7634 },
    { k: 10, lower: 0.7225, n: 10, rate: 1, upper: 1 },
  ])(
    'matches the published 95% interval for $k of $n',
    ({ k, lower, n, rate, upper }) => {
      const result = wilson({ ...AT_95, k, n });

      expect(result.kind).toBe('rate');
      expect(result.kind === 'rate' && result.rate).toBeCloseTo(rate, 4);
      expect(result.kind === 'rate' && result.lower).toBeCloseTo(lower, 4);
      expect(result.kind === 'rate' && result.upper).toBeCloseTo(upper, 4);
    },
  );

  it('keeps both bounds inside [0, 1]', () => {
    const none = wilson({ ...AT_95, k: 0, n: 10 });
    const all = wilson({ ...AT_95, k: 10, n: 10 });

    expect(none.kind === 'rate' && none.lower).toBe(0);
    expect(all.kind === 'rate' && all.upper).toBe(1);
  });

  it('returns insufficient instead of a rate below minN trials', () => {
    expect(wilson({ ...AT_95, k: 5, n: 5 })).toEqual({
      k: 5,
      kind: 'insufficient',
      n: 5,
    });
    expect(wilson({ ...AT_95, k: 6, n: 6 }).kind).toBe('rate');
  });

  it('returns insufficient for zero trials even when minN is zero', () => {
    expect(wilson({ k: 0, minN: 0, n: 0, z: 1.96 }).kind).toBe('insufficient');
  });

  it('rejects counts that cannot be a rate', () => {
    expect(() => wilson({ ...AT_95, k: 11, n: 10 })).toThrow(RangeError);
    expect(() => wilson({ ...AT_95, k: -1, n: 10 })).toThrow(RangeError);
    expect(() => wilson({ ...AT_95, k: 1.5, n: 10 })).toThrow(RangeError);
  });
});
