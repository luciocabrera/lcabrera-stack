import { describe, expect, it } from 'vite-plus/test';

import { areGroupAggregatesLegal } from './areGroupAggregatesLegal.util';

describe('areGroupAggregatesLegal', () => {
  it('accepts an empty list', () => {
    expect(areGroupAggregatesLegal([])).toBe(true);
  });

  it('accepts several functions on one column', () => {
    expect(
      areGroupAggregatesLegal([
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'total_amount', fn: 'avg' },
      ]),
    ).toBe(true);
  });

  it('accepts one function on several columns', () => {
    expect(
      areGroupAggregatesLegal([
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'quantity', fn: 'sum' },
      ]),
    ).toBe(true);
  });

  it('refuses a repeated (columnKey, fn) pair', () => {
    expect(
      areGroupAggregatesLegal([
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'total_amount', fn: 'sum' },
      ]),
    ).toBe(false);
  });

  it('refuses a repeat that is not adjacent', () => {
    expect(
      areGroupAggregatesLegal([
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'quantity', fn: 'max' },
        { columnKey: 'total_amount', fn: 'sum' },
      ]),
    ).toBe(false);
  });

  it('accepts a single countDistinct beside other measures', () => {
    expect(
      areGroupAggregatesLegal([
        { columnKey: 'order_status', fn: 'countDistinct' },
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'order_status', fn: 'count' },
      ]),
    ).toBe(true);
  });

  it('refuses two countDistinct aggregates, which are not a repeated pair', () => {
    expect(
      areGroupAggregatesLegal([
        { columnKey: 'order_status', fn: 'countDistinct' },
        { columnKey: 'shipped_city', fn: 'countDistinct' },
      ]),
    ).toBe(false);
  });

  it('tells two pairs apart when a column key contains a colon', () => {
    expect(
      areGroupAggregatesLegal([
        { columnKey: 'ns:total', fn: 'sum' },
        { columnKey: 'ns', fn: 'sum' },
      ]),
    ).toBe(true);
  });
});
