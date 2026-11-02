import { describe, expect, it } from 'vite-plus/test';

import { isWithinPlot } from './isWithinPlot.util';

describe('isWithinPlot', () => {
  it.each([
    { at: 0, expected: true },
    { at: 50, expected: true },
    { at: 100, expected: true },
    { at: -0.01, expected: false },
    { at: 100.01, expected: false },
  ])('is $expected at $at', ({ at, expected }) => {
    expect(isWithinPlot(at)).toBe(expected);
  });
});
