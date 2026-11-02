import { describe, expect, it } from 'vite-plus/test';

import { gammaDecodeSrgb } from './gammaDecodeSrgb.util';

describe('gammaDecodeSrgb', () => {
  it('keeps both ends of the range in place', () => {
    expect(gammaDecodeSrgb(0)).toBe(0);
    expect(gammaDecodeSrgb(1)).toBeCloseTo(1, 12);
  });

  it('uses the linear segment near black', () => {
    expect(gammaDecodeSrgb(0.03)).toBeCloseTo(0.03 / 12.92, 12);
  });

  it('decodes the sRGB value 188 of 255 to about linear mid-grey', () => {
    expect(gammaDecodeSrgb(188 / 255)).toBeCloseTo(0.5, 2);
  });
});
