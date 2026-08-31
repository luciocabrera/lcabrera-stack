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
    expect(
      countCountDistinct([
        { columnKey: 'order_status', fn: 'countDistinct' },
        { columnKey: 'shipped_city', fn: 'countDistinct' },
      ]),
    ).toBe(2);
  });

  it('counts only countDistinct, not count', () => {
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
