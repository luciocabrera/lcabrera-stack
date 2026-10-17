import { describe, expect, it } from 'vite-plus/test';

import { trendGeometry } from './trendGeometry.util';

const SIZE = { height: 120, padding: 10, width: 220 };

type PointArgs = {
  readonly lower?: number;
  readonly upper?: number;
  readonly value: number;
};

const point = ({ lower, upper, value }: PointArgs) => ({
  href: `/x/${String(value)}`,
  key: String(value),
  label: String(value),
  lower,
  upper,
  value,
});

describe('trendGeometry', () => {
  it('places each rate across the width on a 0 to 1 scale', () => {
    const { bottom, dots, top } = trendGeometry({
      ...SIZE,
      marks: [],
      points: [point({ value: 0 }), point({ value: 0.5 }), point({ value: 1 })],
    });

    expect(dots.map(({ cx }) => cx)).toEqual([10, 110, 210]);
    expect(dots.map(({ cy }) => cy)).toEqual([110, 60, 10]);
    expect([top, bottom]).toEqual([10, 110]);
  });

  it('draws the band along the upper bounds and back along the lower ones', () => {
    const { band } = trendGeometry({
      ...SIZE,
      marks: [],
      points: [
        point({ lower: 0.3, upper: 0.7, value: 0.5 }),
        point({ value: 0.6 }),
      ],
    });

    expect(band).toBe('10,40 210,50 210,50 10,80');
  });

  it('puts each mark on the run it belongs to and drops one off the chart', () => {
    const { marks } = trendGeometry({
      ...SIZE,
      marks: [
        { index: 1, key: 'm', kind: 'model', label: 'model changed' },
        { index: 5, key: 'gone', kind: 'content', label: 'off the end' },
      ],
      points: [
        point({ value: 0.1 }),
        point({ value: 0.2 }),
        point({ value: 0.3 }),
      ],
    });

    expect(marks.map(({ key, x }) => [key, x])).toEqual([['m', 110]]);
  });

  it('centres a lone point', () => {
    const { dots } = trendGeometry({
      ...SIZE,
      marks: [],
      points: [point({ value: 1 })],
    });

    expect(dots[0]?.cx).toBe(110);
  });
});
