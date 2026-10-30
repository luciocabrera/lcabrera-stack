import { describe, expect, it } from 'vite-plus/test';

import { getTrendDomain } from './getTrendDomain.util';

describe('getTrendDomain', () => {
  it('runs from the bottom to a top above it', () => {
    expect(
      getTrendDomain({ bottom: 2, isFlatOnBaseline: true, top: 5 }),
    ).toEqual([2, 5]);
  });

  it('keeps a flat domain when a flat series sits in the middle', () => {
    expect(
      getTrendDomain({ bottom: 3, isFlatOnBaseline: false, top: 3 }),
    ).toEqual([3, 3]);
  });

  it('widens a flat domain by one unit when a flat series sits on the baseline', () => {
    expect(
      getTrendDomain({ bottom: 3, isFlatOnBaseline: true, top: 3 }),
    ).toEqual([3, 4]);
  });

  it('replaces a top below the bottom with a one-unit domain', () => {
    expect(
      getTrendDomain({ bottom: 2, isFlatOnBaseline: false, top: -1 }),
    ).toEqual([2, 3]);
    expect(
      getTrendDomain({ bottom: 2, isFlatOnBaseline: true, top: -1 }),
    ).toEqual([2, 3]);
  });
});
