import { describe, expect, it } from 'vite-plus/test';

import type { ChartBandPoint } from './chart.types';

import { bandPath } from './band-path.util';
import { scaleTime } from './scale-time.util';

const identity = (value: number) => value;

describe('bandPath', () => {
  it('returns an empty path for no points', () => {
    expect(bandPath({ band: [], x: identity, y: identity })).toBe('');
  });

  it('closes a single point into a vertical stroke', () => {
    expect(
      bandPath({
        band: [{ lower: 20, upper: 10, x: 0 }],
        x: identity,
        y: identity,
      }),
    ).toBe('M0,10L0,20Z');
  });

  it('runs along the upper bound and back along the lower bound', () => {
    expect(
      bandPath({
        band: [
          { lower: 1, upper: 3, x: 0 },
          { lower: 2, upper: 4, x: 1 },
          { lower: 3, upper: 5, x: 2 },
        ],
        x: identity,
        y: identity,
      }),
    ).toBe('M0,3L1,4L2,5L2,3L1,2L0,1Z');
  });

  it('splits the band where either bound is null', () => {
    const band: readonly ChartBandPoint[] = JSON.parse(
      '[{"lower":1,"upper":3,"x":0},{"lower":null,"upper":4,"x":1},' +
        '{"lower":2,"upper":6,"x":2},{"lower":3,"upper":7,"x":3},' +
        '{"lower":4,"upper":null,"x":4},{"lower":-1,"upper":1,"x":5}]',
    );

    expect(bandPath({ band, x: identity, y: identity })).toBe(
      'M0,3L0,1ZM2,6L3,7L3,3L2,2ZM5,1L5,-1Z',
    );
  });

  it('splits the band where either bound is missing or non-finite', () => {
    expect(
      bandPath({
        band: [
          { lower: 1, upper: 3, x: 0 },
          { upper: 4, x: 1 },
          { lower: 2, upper: 6, x: 2 },
          { lower: 4, upper: NaN, x: 3 },
          { lower: -1, upper: 1, x: 4 },
        ],
        x: identity,
        y: identity,
      }),
    ).toBe('M0,3L0,1ZM2,6L2,2ZM4,1L4,-1Z');
  });

  it('splits the band at a non-finite x', () => {
    expect(
      bandPath({
        band: [
          { lower: 1, upper: 3, x: 0 },
          { lower: 1, upper: 3, x: Number('Infinity') },
          { lower: 2, upper: 6, x: 2 },
        ],
        x: identity,
        y: identity,
      }),
    ).toBe('M0,3L0,1ZM2,6L2,2Z');
  });

  it('returns an empty path when no point has both bounds', () => {
    expect(
      bandPath({
        band: [{ x: 0 }, { upper: 2, x: 1 }, { lower: 2, x: 2 }],
        x: identity,
        y: identity,
      }),
    ).toBe('');
  });

  it('draws dates on the x axis', () => {
    const x = scaleTime({
      domain: [
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-05T00:00:00Z'),
      ],
      range: [0, 40],
    });

    expect(
      bandPath({
        band: [
          { lower: 1, upper: 2, x: new Date('2026-01-01T00:00:00Z') },
          { lower: 3, upper: 4, x: new Date('2026-01-02T00:00:00Z') },
        ],
        x,
        y: identity,
      }),
    ).toBe('M0,2L10,4L10,3L0,1Z');
  });
});
