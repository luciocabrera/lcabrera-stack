import { describe, expect, it } from 'vitest';

import { resolveClosestSide } from './resolveClosestSide.util';

describe('resolveClosestSide', () => {
  it('returns left when the left edge is closer', () => {
    expect(
      resolveClosestSide({
        distanceFromLeft: 20,
        distanceFromRight: 80,
        originalSide: 'right',
      }),
    ).toBe('left');
  });

  it('returns right when the right edge is closer', () => {
    expect(
      resolveClosestSide({
        distanceFromLeft: 80,
        distanceFromRight: 20,
        originalSide: 'left',
      }),
    ).toBe('right');
  });

  it('falls back to the original side when distances are equal', () => {
    expect(
      resolveClosestSide({
        distanceFromLeft: 50,
        distanceFromRight: 50,
        originalSide: 'left',
      }),
    ).toBe('left');
  });
});
