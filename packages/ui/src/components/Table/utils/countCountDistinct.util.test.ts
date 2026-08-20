import { describe, expect, it } from 'vite-plus/test';

import { countCountDistinct } from './countCountDistinct.util';

describe('countCountDistinct', () => {
  it('counts none in a list of other measures', () => {
    expect(
      countCountDistinct([
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'total_amount', fn: 'count' },
      ]),
    ).toBe(0);
  });

  it('counts across columns, since the budget is per read', () => {
    // The discriminating case for both predicates above it: a count scoped to
    // one column would answer 1 here and let a second distinct count through.
    expect(
      countCountDistinct([
        { columnKey: 'order_status', fn: 'countDistinct' },
        { columnKey: 'shipped_city', fn: 'countDistinct' },
      ]),
    ).toBe(2);
  });

  it('counts only countDistinct, not count', () => {
    // The two share one SQL function and differ by the `DISTINCT` keyword, so a
    // predicate matching on the SQL name would conflate them.
    expect(
      countCountDistinct([
        { columnKey: 'order_status', fn: 'count' },
        { columnKey: 'order_status', fn: 'countDistinct' },
      ]),
    ).toBe(1);
  });

  it('counts nothing in an empty list', () => {
    expect(countCountDistinct([])).toBe(0);
  });
});
