import { describe, expect, it } from 'vite-plus/test';

import { getRelativeLuminance } from './getRelativeLuminance.util';

describe('getRelativeLuminance', () => {
  it('gives 0 for black and 1 for white', () => {
    expect(getRelativeLuminance([0, 0, 0])).toBe(0);
    expect(getRelativeLuminance([1, 1, 1])).toBeCloseTo(1, 12);
  });

  it('weights green above red above blue', () => {
    expect(getRelativeLuminance([0, 1, 0])).toBeCloseTo(0.7152, 12);
    expect(getRelativeLuminance([1, 0, 0])).toBeCloseTo(0.2126, 12);
    expect(getRelativeLuminance([0, 0, 1])).toBeCloseTo(0.0722, 12);
  });
});
