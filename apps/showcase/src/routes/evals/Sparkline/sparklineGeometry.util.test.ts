import { describe, expect, it } from 'vite-plus/test';

import { sparklineGeometry } from './sparklineGeometry.util';

type PointArgs = {
  readonly key?: string;
  readonly value: number;
};

const point = ({ key, value }: PointArgs) => {
  const name = key ?? String(value);

  return { href: `/x/${name}`, key: name, label: name, value };
};

const SIZE = { height: 50, padding: 5, width: 110 };

describe('sparklineGeometry', () => {
  it('spreads the points across the width and scales them to the top value', () => {
    const { dots, line } = sparklineGeometry({
      ...SIZE,
      maxValue: 1,
      points: [point({ value: 0 }), point({ value: 0.5 }), point({ value: 1 })],
    });

    expect(dots.map(({ cx, cy }) => [cx, cy])).toEqual([
      [5, 45],
      [55, 25],
      [105, 5],
    ]);
    expect(line).toBe('5,45 55,25 105,5');
  });

  it('keeps every point with its link', () => {
    const { dots } = sparklineGeometry({
      ...SIZE,
      points: [point({ key: 'a', value: 3 }), point({ key: 'b', value: 6 })],
    });

    expect(dots.map(({ href }) => href)).toEqual(['/x/a', '/x/b']);
    expect(dots.map(({ cy }) => cy)).toEqual([25, 5]);
  });

  it('centres a single point and survives an all-zero series', () => {
    const { dots } = sparklineGeometry({
      ...SIZE,
      points: [point({ value: 0 })],
    });

    expect(dots).toMatchObject([{ cx: 55, cy: 45 }]);
  });

  it('clamps a value above the top to the top edge', () => {
    const { dots } = sparklineGeometry({
      ...SIZE,
      maxValue: 1,
      points: [point({ value: 2 })],
    });

    expect(dots[0]?.cy).toBe(5);
  });
});
