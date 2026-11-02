import { describe, expect, it } from 'vite-plus/test';

import { labToLinearSrgb } from './labToLinearSrgb.util';

const closeTo = ([red = 0, green = 0, blue = 0]: readonly number[]) => [
  expect.closeTo(red, 2),
  expect.closeTo(green, 2),
  expect.closeTo(blue, 2),
];

describe('labToLinearSrgb', () => {
  it.each([
    { rgb: [1, 1, 1], value: 'lab(100 0 0)' },
    { rgb: [1, 1, 1], value: 'lab(100% 0 0)' },
    { rgb: [0, 0, 0], value: 'lab(0 0 0)' },
    { rgb: [0.184186, 0.184186, 0.184186], value: 'lab(50 0 0)' },
    { rgb: [0.005536, 0.005536, 0.005536], value: 'lab(5 0 0)' },
    { rgb: [1, 0, 0], value: 'lab(54.29 80.8 69.89)' },
    { rgb: [0, 0, 1], value: 'lab(29.57 68.29 -112.03)' },
  ])('converts $value', ({ rgb, value }) => {
    expect(labToLinearSrgb(value).rgb).toEqual(closeTo(rgb));
  });

  it('keeps the alpha', () => {
    expect(labToLinearSrgb('lab(12 34.23 -54.75 / 0.76)').alpha).toBe(0.76);
  });
});
