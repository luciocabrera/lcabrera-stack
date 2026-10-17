import { describe, expect, it } from 'vite-plus/test';

import { rateFigures } from './rateFigures.util';

describe('rateFigures', () => {
  it('gives the rate and its Wilson interval once there are enough trials', () => {
    const figures = rateFigures({ k: 8, n: 10 });

    expect(figures.rate).toBe(0.8);
    expect(figures.lower).toBeCloseTo(0.49, 2);
    expect(figures.upper).toBeCloseTo(0.943, 2);
  });

  it('gives a rate but no interval below the trial floor', () => {
    expect(rateFigures({ k: 2, n: 3 })).toMatchObject({
      lower: undefined,
      rate: 2 / 3,
      upper: undefined,
    });
  });

  it('gives no rate when nothing was scored', () => {
    expect(rateFigures({ k: 0, n: 0 }).rate).toBeUndefined();
  });
});
