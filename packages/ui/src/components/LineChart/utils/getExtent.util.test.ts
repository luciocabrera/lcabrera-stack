import { describe, expect, it } from 'vite-plus/test';

import { getExtent } from './getExtent.util';

describe('getExtent', () => {
  it('returns the lowest and highest value', () => {
    expect(getExtent([3, -2, 7, 0])).toEqual([-2, 7]);
  });

  it('skips values that are not finite', () => {
    expect(getExtent([NaN, 4, Infinity, 1])).toEqual([1, 4]);
  });

  it('returns one value twice for a single value', () => {
    expect(getExtent([5])).toEqual([5, 5]);
  });

  it('returns undefined when no value is finite', () => {
    expect(getExtent([])).toBeUndefined();
    expect(getExtent([NaN])).toBeUndefined();
  });
});
