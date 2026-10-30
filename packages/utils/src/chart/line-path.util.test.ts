import { describe, expect, it } from 'vite-plus/test';

import type { ChartPoint } from './chart.types';

import { linePath } from './line-path.util';
import { scaleLinear } from './scale-linear.util';
import { scaleTime } from './scale-time.util';

const identity = (value: number) => value;

describe('linePath', () => {
  it('returns an empty path for no points', () => {
    expect(linePath({ points: [], x: identity, y: identity })).toBe('');
  });

  it('draws a single point as a zero-length segment', () => {
    expect(
      linePath({ points: [{ x: 5, y: 10 }], x: identity, y: identity }),
    ).toBe('M5,10L5,10');
  });

  it('draws a line through the points through both scales', () => {
    const x = scaleLinear({ domain: [0, 2], range: [0, 80] });
    const y = scaleLinear({ domain: [1, 5], range: [20, 0] });

    expect(
      linePath({
        points: [
          { x: 0, y: 1 },
          { x: 1, y: 5 },
          { x: 2, y: 2 },
        ],
        x,
        y,
      }),
    ).toBe('M0,20L40,0L80,15');
  });

  it('breaks the line at a null value and starts again after it', () => {
    const points: readonly ChartPoint[] = JSON.parse(
      '[{"x":0,"y":1},{"x":1,"y":null},{"x":2,"y":3},{"x":3,"y":4}]',
    );

    expect(linePath({ points, x: identity, y: identity })).toBe(
      'M0,1L0,1M2,3L3,4',
    );
  });

  it('breaks the line at a missing or non-finite value', () => {
    expect(
      linePath({
        points: [
          { x: 0, y: 1 },
          { x: 1 },
          { x: 2, y: 3 },
          { x: 3, y: NaN },
          { x: 4, y: 5 },
          { x: 5, y: undefined },
          { x: 6, y: 7 },
          { x: 7, y: 8 },
        ],
        x: identity,
        y: identity,
      }),
    ).toBe('M0,1L0,1M2,3L2,3M4,5L4,5M6,7L7,8');
  });

  it('draws a lone point between gaps as a zero-length segment', () => {
    expect(
      linePath({
        points: [
          { x: 0 },
          { x: 1, y: 2 },
          { x: 2 },
          { x: 3, y: 4 },
          { x: 4, y: 5 },
        ],
        x: identity,
        y: identity,
      }),
    ).toBe('M1,2L1,2M3,4L4,5');
  });

  it('breaks the line at a non-finite or missing x', () => {
    const points: readonly ChartPoint[] = JSON.parse(
      '[{"x":0,"y":1},{"x":1,"y":2},{"x":null,"y":3},{"x":3,"y":4},{"x":4,"y":5}]',
    );

    expect(
      linePath({
        points: [...points, { x: Number('NaN'), y: 6 }, { x: 6, y: 7 }],
        x: identity,
        y: identity,
      }),
    ).toBe('M0,1L1,2M3,4L4,5M6,7L6,7');
  });

  it('starts at the first value after a leading gap', () => {
    expect(
      linePath({
        points: [{ x: 0 }, { x: 1, y: 2 }, { x: 2, y: 3 }],
        x: identity,
        y: identity,
      }),
    ).toBe('M1,2L2,3');
  });

  it('returns an empty path when no value is finite', () => {
    expect(
      linePath({
        points: [{ x: 0 }, { x: 1, y: Infinity }],
        x: identity,
        y: identity,
      }),
    ).toBe('');
  });

  it('draws dates on the x axis', () => {
    const x = scaleTime({
      domain: [
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-03T00:00:00Z'),
      ],
      range: [0, 100],
    });

    expect(
      linePath({
        points: [
          { x: new Date('2026-01-01T00:00:00Z'), y: 4 },
          { x: new Date('2026-01-02T00:00:00Z'), y: -2 },
          { x: new Date('2026-01-03T00:00:00Z'), y: 6 },
        ],
        x,
        y: identity,
      }),
    ).toBe('M0,4L50,-2L100,6');
  });
});
