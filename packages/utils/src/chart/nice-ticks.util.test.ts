import { describe, expect, it } from 'vite-plus/test';

import { niceTicks } from './nice-ticks.util';

describe('niceTicks', () => {
  it('returns the one value when the bounds are equal', () => {
    expect(niceTicks({ count: 5, max: 4, min: 4 })).toEqual([4]);
  });

  it('returns no ticks when no ticks are asked for', () => {
    expect(niceTicks({ count: 0, max: 10, min: 0 })).toEqual([]);
  });

  it('steps by one, two, five or ten times a power of ten', () => {
    expect(niceTicks({ count: 1, max: 1, min: 0 })).toEqual([0, 1]);
    expect(niceTicks({ count: 5, max: 10, min: 0 })).toEqual([
      0, 2, 4, 6, 8, 10,
    ]);
    expect(niceTicks({ count: 4, max: 13, min: -7 })).toEqual([-5, 0, 5, 10]);
    expect(niceTicks({ count: 10, max: 80, min: 0 })).toEqual([
      0, 10, 20, 30, 40, 50, 60, 70, 80,
    ]);
  });

  it('rounds a raw step up to the next multiple at each boundary', () => {
    expect(niceTicks({ count: 2, max: 3, min: 0 })).toEqual([0, 2]);
    expect(niceTicks({ count: 2, max: 6, min: 0 })).toEqual([0, 5]);
    expect(niceTicks({ count: 2, max: 14, min: 0 })).toEqual([0, 10]);
  });

  it('keeps every tick inside the bounds', () => {
    expect(niceTicks({ count: 5, max: 17, min: 3 })).toEqual([
      4, 6, 8, 10, 12, 14, 16,
    ]);
  });

  it('accepts the bounds in either order', () => {
    expect(niceTicks({ count: 5, max: 0, min: 10 })).toEqual([
      0, 2, 4, 6, 8, 10,
    ]);
  });

  it('gives exact ticks at a scale of 1e-3', () => {
    expect(niceTicks({ count: 5, max: 0.001, min: 0 })).toEqual([
      0, 0.0002, 0.0004, 0.0006, 0.0008, 0.001,
    ]);
  });

  it('gives exact ticks at a scale of 1e6', () => {
    expect(niceTicks({ count: 5, max: 1_000_000, min: 0 })).toEqual([
      0, 200_000, 400_000, 600_000, 800_000, 1_000_000,
    ]);
  });
});
