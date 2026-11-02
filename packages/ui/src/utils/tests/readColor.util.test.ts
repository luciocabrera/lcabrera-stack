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

  it.each(['#ffffff00', 'rgb(0 0 0)', 'var(--x)'])('refuses %s', (value) => {
    expect(() => readColor(value)).toThrow(`Unsupported colour value ${value}`);
  });
});
