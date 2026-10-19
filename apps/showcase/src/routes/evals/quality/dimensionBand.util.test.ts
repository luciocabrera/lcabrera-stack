import { describe, expect, it } from 'vite-plus/test';

import { dimensionBand } from './dimensionBand.util';

describe('dimensionBand', () => {
  it('spans the mean plus and minus two sample standard deviations', () => {
    expect(dimensionBand([3, 4, 5])).toEqual({
      lower: 2,
      mean: 4,
      runs: 3,
      upper: 6,
    });
  });

  it('draws no band from fewer than two runs', () => {
    expect(dimensionBand([4])).toBeUndefined();
  });
});
