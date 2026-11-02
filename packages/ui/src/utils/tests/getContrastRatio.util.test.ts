import { describe, expect, it } from 'vite-plus/test';

import { getContrastRatio } from './getContrastRatio.util';

describe('getContrastRatio', () => {
  it('gives 21 for black on white and 1 for a colour on itself', () => {
    expect(
      getContrastRatio({
        background: 'lab(100 0 0)',
        foreground: 'lab(0 0 0)',
      }),
    ).toBeCloseTo(21, 3);
    expect(
      getContrastRatio({
        background: 'oklch(50% 0 0)',
        foreground: 'oklch(50% 0 0)',
      }),
    ).toBe(1);
  });

  it('is symmetric in which colour is lighter', () => {
    expect(
      getContrastRatio({
        background: 'lab(0 0 0)',
        foreground: 'lab(100 0 0)',
      }),
    ).toBeCloseTo(21, 3);
  });

  it('composites a translucent foreground over the background before measuring', () => {
    expect(
      getContrastRatio({
        background: 'lab(100 0 0)',
        foreground: 'lab(0 0 0 / 0)',
      }),
    ).toBeCloseTo(1, 6);
    expect(
      getContrastRatio({
        background: 'lab(100 0 0)',
        foreground: 'lab(0 0 0 / 0.5)',
      }),
    ).toBeCloseTo(3.98, 2);
  });

  it('measures a translucent mid-tone below the AA body-text threshold', () => {
    expect(
      getContrastRatio({
        background: 'oklch(99% 0 0)',
        foreground: 'lab(45 20 -30 / 0.8)',
      }),
    ).toBeCloseTo(3.47, 2);
  });

  it('rejects a translucent background', () => {
    expect(() =>
      getContrastRatio({
        background: 'lab(100 0 0 / 0.5)',
        foreground: 'lab(0 0 0)',
      }),
    ).toThrow('is translucent');
  });
});
