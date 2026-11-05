import { describe, expect, it } from 'vite-plus/test';

import { readLinearColor } from './readLinearColor.util';

describe('readLinearColor', () => {
  it('reads an oklch value without clipping an out-of-gamut channel', () => {
    const { rgb } = readLinearColor('oklch(85% 0.08 266)');

    expect(rgb[2]).toBeCloseTo(1.0375, 3);
  });

  it('reads a lab value without clipping an out-of-gamut channel', () => {
    const { rgb } = readLinearColor('lab(53 0.01 250)');

    expect(rgb[2]).toBeLessThan(-0.15);
  });

  it('carries the alpha through', () => {
    expect(readLinearColor('oklch(0% 0 0 / 0.5)').alpha).toBe(0.5);
  });

  it('refuses a value it cannot convert', () => {
    expect(() => readLinearColor('#ffffff')).toThrow(
      'Unsupported colour value #ffffff',
    );
  });
});
