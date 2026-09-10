import { describe, expect, it } from 'vite-plus/test';

import { toExpandingMeasureCount } from './to-expanding-measure-count.util.ts';

describe('toExpandingMeasureCount', () => {
  it('holds a leading count(*) out of the expanded measure count', () => {
    expect(
      toExpandingMeasureCount([
        { fn: 'count' },
        { column: 'amount', fn: 'sum' },
      ]),
    ).toBe(1);
  });

  it('counts every aggregate when there is no leading count(*)', () => {
    expect(toExpandingMeasureCount([{ column: 'amount', fn: 'sum' }])).toBe(1);
  });

  it('is zero when the only aggregate is the leading count(*)', () => {
    expect(toExpandingMeasureCount([{ fn: 'count' }])).toBe(0);
  });
});
