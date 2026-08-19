import { describe, expect, it } from 'vite-plus/test';

import { pruneGroupPeriods } from './pruneGroupPeriods.util';

describe('pruneGroupPeriods', () => {
  it('drops a granularity whose key is gone', () => {
    // Not inert: the server refuses a granularity map naming a column that is
    // not a group key, so carrying it across would take the whole grouped read
    // down rather than being quietly ignored.
    expect(
      pruneGroupPeriods({
        keys: ['status'],
        periods: { order_date: 'month', status: 'year' },
      }),
    ).toStrictEqual({ status: 'year' });
  });

  it('answers the same instance when nothing was dropped', () => {
    const periods = { order_date: 'month' } as const;

    expect(pruneGroupPeriods({ keys: ['order_date', 'status'], periods })).toBe(
      periods,
    );
  });

  it('empties out when every key went', () => {
    expect(
      pruneGroupPeriods({ keys: [], periods: { order_date: 'month' } }),
    ).toStrictEqual({});
  });
});
