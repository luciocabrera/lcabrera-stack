import { describe, expect, it } from 'vite-plus/test';

import { getTrendPointsGeometry } from './getTrendPointsGeometry.util';

const SIZE = { height: 48, isConnected: true, width: 108 };

const centres = (
  dots: readonly { readonly cx: number; readonly cy: number }[],
) => dots.map(({ cx, cy }) => [cx, cy]);

describe('getTrendPointsGeometry', () => {
  it('returns no dots and no line for no points', () => {
    expect(getTrendPointsGeometry({ ...SIZE, points: [] })).toEqual({
      dots: [],
      line: '',
    });
  });

  it('spreads the points across the inset width and scales them from zero to the maximum', () => {
    const { dots, line } = getTrendPointsGeometry({
      ...SIZE,
      max: 1,
      points: [{ value: 0 }, { value: 0.5 }, { value: 1 }],
    });

    expect(centres(dots)).toEqual([
      [4, 44],
      [54, 24],
      [104, 4],
    ]);
    expect(line).toBe('M4,44L54,24L104,4');
  });

  it('scales to the highest value when no maximum is given', () => {
    const { dots } = getTrendPointsGeometry({
      ...SIZE,
      points: [{ value: 3 }, { value: 6 }],
    });

    expect(centres(dots)).toEqual([
      [4, 24],
      [104, 4],
    ]);
  });

  it('extends the scale below zero for a negative value', () => {
    const { dots } = getTrendPointsGeometry({
      ...SIZE,
      points: [{ value: -2 }, { value: 2 }],
    });

    expect(centres(dots)).toEqual([
      [4, 44],
      [104, 4],
    ]);
  });

  it('centres a single point and sets an all-zero series on the baseline', () => {
    const { dots } = getTrendPointsGeometry({
      ...SIZE,
      points: [{ value: 0 }],
    });

    expect(centres(dots)).toEqual([[54, 44]]);
  });

  it('falls back to a one-unit scale when the maximum is not above the baseline', () => {
    const { dots } = getTrendPointsGeometry({
      ...SIZE,
      max: -5,
      points: [{ value: -2 }, { value: 3 }],
    });

    expect(dots.map(({ cy }) => cy)).toEqual([44, 4]);
  });

  it('holds a value above the maximum at the top edge', () => {
    const { dots } = getTrendPointsGeometry({
      ...SIZE,
      max: 1,
      points: [{ value: 2 }],
    });

    expect(dots[0]?.cy).toBe(4);
  });

  it('keeps the tone, link and label of every point', () => {
    const { dots } = getTrendPointsGeometry({
      ...SIZE,
      points: [
        { label: 'First', to: '/a', tone: 'success', value: 1 },
        { value: 2 },
      ],
    });

    expect(dots).toMatchObject([
      { label: 'First', to: '/a', tone: 'success', value: 1 },
      { value: 2 },
    ]);
  });

  it('draws no line when the points are not connected', () => {
    const { dots, line } = getTrendPointsGeometry({
      ...SIZE,
      isConnected: false,
      points: [{ value: 1 }, { value: 2 }],
    });

    expect(line).toBe('');
    expect(dots).toHaveLength(2);
  });

  it('draws no dot for a non-finite value and scales from the finite ones', () => {
    const { dots, line } = getTrendPointsGeometry({
      ...SIZE,
      points: [{ value: 2 }, { value: Number('NaN') }, { value: 4 }],
    });

    expect(dots.map(({ cx, cy, position }) => [position, cx, cy])).toEqual([
      [0, 4, 24],
      [2, 104, 4],
    ]);
    expect(line).toBe('M4,24L4,24M104,4L104,4');
  });
});
