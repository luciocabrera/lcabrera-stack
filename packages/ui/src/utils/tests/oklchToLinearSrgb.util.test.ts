import { describe, expect, it } from 'vite-plus/test';

import { oklchToLinearSrgb } from './oklchToLinearSrgb.util';

const closeTo = ([red = 0, green = 0, blue = 0]: readonly number[]) => [
  expect.closeTo(red, 3),
  expect.closeTo(green, 3),
  expect.closeTo(blue, 3),
];

describe('oklchToLinearSrgb', () => {
  it.each([
    { rgb: [1, 1, 1], value: 'oklch(100% 0 0)' },
    { rgb: [1, 1, 1], value: 'oklch(1 0 0)' },
    { rgb: [0, 0, 0], value: 'oklch(0% 0 0)' },
    { rgb: [1, 0, 0], value: 'oklch(62.796% 0.25768 29.2339)' },
    { rgb: [0, 0, 1], value: 'oklch(45.201% 0.31321 264.052)' },
  ])('converts $value', ({ rgb, value }) => {
    expect(oklchToLinearSrgb(value).rgb).toEqual(closeTo(rgb));
  });

  it('reads a percentage chroma, where 100% is 0.4', () => {
    expect(oklchToLinearSrgb('oklch(50% 25% 120)').rgb).toEqual(
      closeTo(oklchToLinearSrgb('oklch(50% 0.1 120)').rgb),
    );
  });

  it('keeps the alpha', () => {
    expect(oklchToLinearSrgb('oklch(92% 0.03 25 / 0.32)').alpha).toBe(0.32);
  });
});
