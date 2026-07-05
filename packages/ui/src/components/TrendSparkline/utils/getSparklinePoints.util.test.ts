import { describe, expect, it } from 'vitest';

import { getSparklinePoints } from './getSparklinePoints.util';

describe('getSparklinePoints', () => {
  it('returns an empty string for no values', () => {
    expect(getSparklinePoints({ height: 20, values: [], width: 100 })).toBe('');
  });

  it('returns a flat mid-height line for a single value', () => {
    expect(getSparklinePoints({ height: 20, values: [5], width: 100 })).toBe(
      '0,10 100,10',
    );
  });

  it('returns a flat mid-height line when every value is identical', () => {
    expect(
      getSparklinePoints({ height: 20, values: [3, 3, 3], width: 100 }),
    ).toBe('0,10 50,10 100,10');
  });

  it('maps the min value to the bottom and the max value to the top', () => {
    const points = getSparklinePoints({
      height: 20,
      values: [0, 10],
      width: 100,
    });

    expect(points).toBe('0,20 100,0');
  });

  it('spaces points evenly across the width', () => {
    const points = getSparklinePoints({
      height: 10,
      values: [0, 5, 10],
      width: 100,
    });

    expect(points).toBe('0,10 50,5 100,0');
  });
});
