import { describe, expect, it } from 'vite-plus/test';

import { readColorChannels } from './readColorChannels.util';

describe('readColorChannels', () => {
  it('reads three channels and an implicit opaque alpha', () => {
    expect(readColorChannels('oklch(35% 0.08 266)')).toEqual({
      alpha: 1,
      channels: [
        { isPercent: true, number: 35 },
        { isPercent: false, number: 0.08 },
        { isPercent: false, number: 266 },
      ],
    });
  });

  it('reads a numeric and a percentage alpha', () => {
    expect(readColorChannels('lab(12 34.23 -54.75 / 0.76)').alpha).toBe(0.76);
    expect(readColorChannels('lab(50 0 0 / 50%)').alpha).toBe(0.5);
  });

  it('reads negative and leading-dot channels', () => {
    expect(
      readColorChannels('lab(9.51012% -.812642 -2.82544)').channels,
    ).toEqual([
      { isPercent: true, number: 9.51012 },
      { isPercent: false, number: -0.812642 },
      { isPercent: false, number: -2.82544 },
    ]);
  });

  it.each([
    'oklch(from brandPrimary l+0.10 c+0.05)',
    'oklch(92% 0.03 25 / x)',
    'oklch(92% 0.03 25 / 1 / 1)',
    'oklch(92% 0.03 25 4)',
    'lab(12 34.23)',
  ])('refuses %s', (value) => {
    expect(() => readColorChannels(value)).toThrow(
      `Cannot read the channels of ${value}`,
    );
  });
});
