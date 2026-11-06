import { describe, expect, it } from 'vite-plus/test';

import { getPointName } from './getPointName.util';

const formatters = {
  x: (x: Date | number) => `x${String(x)}`,
  y: (y: number) => `${String(y)}%`,
};

describe('getPointName', () => {
  it('uses the point label when there is one', () => {
    expect(
      getPointName({
        formatters,
        point: { label: 'Named', x: 1, y: 2 },
        seriesLabel: 'Series',
      }),
    ).toBe('Named');
  });

  it('names the point by its series and formatted values otherwise', () => {
    expect(
      getPointName({
        formatters,
        point: { x: 1, y: 2 },
        seriesLabel: 'Series',
      }),
    ).toBe('Series: x1, 2%');
  });
});
