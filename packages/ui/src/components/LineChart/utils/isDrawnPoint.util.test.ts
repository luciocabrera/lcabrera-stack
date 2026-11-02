import { describe, expect, it } from 'vite-plus/test';

import { isDrawnPoint } from './isDrawnPoint.util';

const GAP: null = JSON.parse('null');

describe('isDrawnPoint', () => {
  it.each([
    { expected: true, point: { x: 1, y: 2 } },
    { expected: true, point: { x: new Date(0), y: 0 } },
    { expected: false, point: { x: 1, y: GAP } },
    { expected: false, point: { x: 1, y: Number('NaN') } },
    { expected: false, point: { x: Number('NaN'), y: 1 } },
    { expected: false, point: { x: new Date(Number('NaN')), y: 1 } },
  ])('is $expected for $point', ({ expected, point }) => {
    expect(isDrawnPoint(point)).toBe(expected);
  });
});
