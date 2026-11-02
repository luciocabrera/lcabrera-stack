import { describe, expect, it } from 'vite-plus/test';

import { gammaDecodeSrgb } from './gammaDecodeSrgb.util';
import { gammaEncodeSrgb } from './gammaEncodeSrgb.util';

describe('gammaEncodeSrgb', () => {
  it('keeps both ends of the range in place', () => {
    expect(gammaEncodeSrgb(0)).toBe(0);
    expect(gammaEncodeSrgb(1)).toBeCloseTo(1, 12);
  });

  it('uses the linear segment near black', () => {
    expect(gammaEncodeSrgb(0.002)).toBeCloseTo(0.02584, 10);
  });

  it('encodes linear mid-grey to the sRGB value 188 of 255', () => {
    expect(Math.round(255 * gammaEncodeSrgb(0.5))).toBe(188);
  });

  it('is undone by gammaDecodeSrgb', () => {
    expect(gammaDecodeSrgb(gammaEncodeSrgb(0.3))).toBeCloseTo(0.3, 12);
  });
});
