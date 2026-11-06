import { describe, expect, it } from 'vite-plus/test';

import { readColor } from './readColor.util';

describe('readColor', () => {
  it('reads an oklch colour as encoded sRGB', () => {
    expect(readColor('oklch(100% 0 0)')).toEqual({
      alpha: 1,
      rgb: [expect.closeTo(1, 3), expect.closeTo(1, 3), expect.closeTo(1, 3)],
    });
  });

  it('reads a lab colour as encoded sRGB, keeping its alpha', () => {
    expect(readColor('lab(50 0 0 / 0.5)')).toEqual({
      alpha: 0.5,
      rgb: [
        expect.closeTo(0.4663, 3),
        expect.closeTo(0.4663, 3),
        expect.closeTo(0.4663, 3),
      ],
    });
  });

  it.each([
    { bytes: [165, 91, 171], value: 'lab(50 40 -30)' },
    { bytes: [117, 93, 154], value: 'lab(44 20 -30)' },
    { bytes: [79, 132, 186], value: 'oklch(0.6 0.1 250)' },
    { bytes: [236, 239, 242], value: 'oklch(95% 0.005 250)' },
  ])(
    'reads $value as the sRGB bytes a CSS colour parser derives',
    ({ bytes, value }) => {
      expect(
        readColor(value).rgb.map((channel) => Math.round(255 * channel)),
      ).toEqual(bytes);
    },
  );

  it('reads a hex colour as encoded sRGB, keeping its alpha', () => {
    expect(readColor('#efeded99')).toEqual({
      alpha: 0.6,
      rgb: [
        expect.closeTo(239 / 255, 10),
        expect.closeTo(237 / 255, 10),
        expect.closeTo(237 / 255, 10),
      ],
    });
  });

  it.each(['#fff', 'rgb(0 0 0)', 'var(--x)'])('refuses %s', (value) => {
    expect(() => readColor(value)).toThrow(`Unsupported colour value ${value}`);
  });
});
