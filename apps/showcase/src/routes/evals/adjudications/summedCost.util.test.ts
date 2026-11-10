import { describe, expect, it } from 'vite-plus/test';

import { summedCost } from './summedCost.util';

describe('summedCost', () => {
  it('sums the reported costs and skips the unreported ones', () => {
    expect(summedCost([0.25, undefined, 0.5])).toBe(0.75);
  });

  it('reports no cost when none was reported', () => {
    expect(summedCost([undefined, undefined])).toBeUndefined();
    expect(summedCost([])).toBeUndefined();
  });
});
