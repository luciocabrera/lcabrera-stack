import { describe, expect, it } from 'vite-plus/test';

import { formatPathPoint } from './format-path-point.util';

describe('formatPathPoint', () => {
  it('writes an x,y pair', () => {
    expect(formatPathPoint({ x: 40, y: 0 })).toBe('40,0');
  });

  it('rounds each coordinate to two decimal places', () => {
    expect(formatPathPoint({ x: 33.333333, y: -5.678 })).toBe('33.33,-5.68');
  });
});
