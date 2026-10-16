import { describe, expect, it } from 'vite-plus/test';

import { pointsLabel } from './pointsLabel.util';

describe('pointsLabel', () => {
  it('reads a difference of two rates as percentage points', () => {
    expect(pointsLabel(0.125)).toBe('12.5 pts');
    expect(pointsLabel(0.05)).toBe('5 pts');
  });
});
