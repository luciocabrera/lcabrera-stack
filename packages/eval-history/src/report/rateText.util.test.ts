import { describe, expect, it } from 'vite-plus/test';

import { rateText } from './rateText.util.ts';

describe('rateText', () => {
  it('prints the rate with n and its interval', () => {
    expect(
      rateText({
        excluded: 0,
        rate: { k: 9, kind: 'rate', lower: 0.6, n: 10, rate: 0.9, upper: 0.98 },
      }),
    ).toBe('90.0% (n=10, 60.0%–98.0%)');
  });

  it('says insufficient data, with n, and counts what it left out', () => {
    expect(
      rateText({ excluded: 2, rate: { k: 1, kind: 'insufficient', n: 2 } }),
    ).toBe('insufficient data (n=2, 1 passed, 2 not counted)');
  });
});
