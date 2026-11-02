import { describe, expect, it } from 'vite-plus/test';

import { gammaEncodeSrgb } from './gammaEncodeSrgb.util';
import { toLinearSrgb } from './toLinearSrgb.util';

describe('toLinearSrgb', () => {
  it('maps lab white and black to the ends of the sRGB range', () => {
    expect(
      toLinearSrgb('lab(100 0 0)').rgb.map((channel) => channel.toFixed(3)),
    ).toEqual(['1.000', '1.000', '1.000']);
    expect(toLinearSrgb('lab(0 0 0)').rgb).toEqual([0, 0, 0]);
  });

  it('maps oklch white and black to the ends of the sRGB range', () => {
    expect(
      toLinearSrgb('oklch(100% 0 0)').rgb.map((channel) => channel.toFixed(3)),
    ).toEqual(['1.000', '1.000', '1.000']);
    expect(toLinearSrgb('oklch(0% 0 0)').rgb).toEqual([0, 0, 0]);
  });

  it('reads a percentage lightness the same as its number', () => {
    expect(toLinearSrgb('lab(50% 10 -10)')).toEqual(
      toLinearSrgb('lab(50 10 -10)'),
    );
    expect(toLinearSrgb('oklch(60% 0.1 250)')).toEqual(
      toLinearSrgb('oklch(0.6 0.1 250)'),
    );
  });

  it.each([
    { expected: [165, 91, 171], value: 'lab(50 40 -30)' },
    { expected: [117, 93, 154], value: 'lab(44 20 -30)' },
    { expected: [79, 132, 186], value: 'oklch(0.6 0.1 250)' },
    { expected: [236, 239, 242], value: 'oklch(95% 0.005 250)' },
  ])(
    'converts $value to the sRGB bytes a CSS colour parser derives',
    ({ expected, value }) => {
      expect(
        toLinearSrgb(value).rgb.map((channel) =>
          Math.round(255 * gammaEncodeSrgb(channel)),
        ),
      ).toEqual(expected);
    },
  );

  it('reads the alpha after the slash and defaults it to opaque', () => {
    expect(toLinearSrgb('lab(45 20 -30 / 0.8)').alpha).toBe(0.8);
    expect(toLinearSrgb('oklch(0% 0 0 / 50%)').alpha).toBe(0.5);
    expect(toLinearSrgb('oklch(99% 0 0)').alpha).toBe(1);
  });

  it('rejects a colour outside the sRGB gamut', () => {
    expect(() => toLinearSrgb('lab(53 0.01 250)')).toThrow(
      'outside the sRGB gamut',
    );
  });

  it('rejects a colour syntax it does not parse', () => {
    expect(() => toLinearSrgb('#ffffff')).toThrow('Unsupported colour value');
  });
});
