import { describe, expect, it } from 'vite-plus/test';

import { decimate } from './decimate.util';

const series = (values: readonly number[]) => values.map((y, x) => ({ x, y }));

describe('decimate', () => {
  it('returns the input when the threshold keeps every point', () => {
    const points = series([1, 2, 3, 4]);

    expect(decimate({ points, threshold: 4 })).toBe(points);
    expect(decimate({ points, threshold: 9 })).toBe(points);
  });

  it('returns the input when the threshold is below three', () => {
    const points = series([1, 2, 3, 4, 5]);

    expect(decimate({ points, threshold: 2 })).toBe(points);
  });

  it('returns the input when there are no points', () => {
    const points = series([]);

    expect(decimate({ points, threshold: 3 })).toBe(points);
  });

  it('keeps the first, last, minimum and maximum points', () => {
    const points = series([0, 1, 2, 100, 1, 0, -100, 1, 2, 3]);

    expect(decimate({ points, threshold: 4 })).toEqual([
      { x: 0, y: 0 },
      { x: 3, y: 100 },
      { x: 6, y: -100 },
      { x: 9, y: 3 },
    ]);
  });

  it('keeps one point per bucket at a threshold of three', () => {
    const points = series([5, 2, 9, 4, 5]);

    expect(decimate({ points, threshold: 3 })).toEqual([
      { x: 0, y: 5 },
      { x: 2, y: 9 },
      { x: 4, y: 5 },
    ]);
  });

  it('keeps the earlier point when two in a bucket tie', () => {
    const points = series([5, 1, 9, 2, 5]);

    expect(decimate({ points, threshold: 3 })).toEqual([
      { x: 0, y: 5 },
      { x: 1, y: 1 },
      { x: 4, y: 5 },
    ]);
  });

  it.each([
    {
      case: 'by triangle area against the previous pick and the next bucket mean',
      kept: [1, 5, 18, 25, 31, 40],
      xs: [
        1, 2, 4, 5, 9, 10, 11, 15, 16, 18, 21, 22, 25, 27, 28, 31, 32, 36, 37,
        40,
      ],
      ys: [3, 7, 2, 9, 4, 4, 8, 1, 6, 12, 5, 5, 0, 7, 3, 10, 2, 6, 9, 4],
    },
    {
      case: 'measuring each bucket from the point kept in the bucket before',
      kept: [1, 5, 25, 34, 43, 56],
      xs: [1, 5, 10, 11, 15, 25, 34, 41, 43, 48, 50, 56],
      ys: [18, 1, 9, 0, 8, 15, 19, 12, 13, 12, 18, 14],
    },
  ])('picks $case', ({ kept, xs, ys }) => {
    const points = xs.map((x, index) => ({ x, y: ys[index] ?? 0 }));

    expect(decimate({ points, threshold: 6 }).map(({ x }) => x)).toEqual(kept);
  });

  it('keeps the fields of each point it returns', () => {
    const points = [0, 8, 1, 2].map((y, x) => ({
      label: `p${String(x)}`,
      x,
      y,
    }));

    expect(
      decimate({ points, threshold: 3 }).map(({ label }) => label),
    ).toEqual(['p0', 'p1', 'p3']);
  });

  it('thins a long series in linear time', () => {
    const points = Array.from({ length: 200_000 }, (_, x) => ({
      x,
      y: Math.sin(x / 50) * 100 + (x % 7),
    }));
    const started = performance.now();
    const coarse = decimate({ points, threshold: 1000 });
    const fine = decimate({ points, threshold: 50_000 });
    const elapsed = performance.now() - started;

    expect(coarse).toHaveLength(1000);
    expect(fine).toHaveLength(50_000);
    expect(elapsed).toBeLessThan(2000);
  });

  it('reads dates on the x axis', () => {
    const points = [0, 1, 50, 2, 3].map((y, index) => ({
      x: new Date(Date.UTC(2026, 0, index + 1)),
      y,
    }));

    expect(decimate({ points, threshold: 3 }).map(({ y }) => y)).toEqual([
      0, 50, 3,
    ]);
  });
});
