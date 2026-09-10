import { describe, expect, it } from 'vite-plus/test';

import { expandColumnAxisAggregates } from './expand-column-axis-aggregates.util.ts';

describe('expandColumnAxisAggregates', () => {
  it('emits one FILTER aggregate per value, in value order, keeping the measure', () => {
    expect(
      expandColumnAxisAggregates({
        aggregates: [{ column: 'total_amount', fn: 'sum' }],
        columnAxis: { key: 'order_status', values: ['Pending', 'Shipped'] },
      }),
    ).toEqual([
      {
        alias: 'sum_total_amount_c0',
        axisValue: 'Pending',
        column: 'total_amount',
        filters: [{ column: 'order_status', operator: 'eq', value: 'Pending' }],
        fn: 'sum',
      },
      {
        alias: 'sum_total_amount_c1',
        axisValue: 'Shipped',
        column: 'total_amount',
        filters: [{ column: 'order_status', operator: 'eq', value: 'Shipped' }],
        fn: 'sum',
      },
    ]);
  });

  it('uses IS NULL for a missing value, because equality with NULL matches nothing', () => {
    expect(
      expandColumnAxisAggregates({
        aggregates: [{ fn: 'count' }],
        columnAxis: { key: 'order_status', values: [undefined] },
      }),
    ).toEqual([
      {
        alias: 'count_rows_c0',
        axisValue: undefined,
        filters: [{ column: 'order_status', operator: 'isNull' }],
        fn: 'count',
      },
    ]);
  });

  it('stores a driver SQL NULL as undefined', () => {
    expect(
      expandColumnAxisAggregates({
        aggregates: [{ fn: 'count' }],
        columnAxis: {
          key: 'order_status',
          values: [JSON.parse('null')],
        },
      })[0]?.axisValue,
    ).toBeUndefined();
  });

  it('crosses several measures with several values, value-major', () => {
    const expanded = expandColumnAxisAggregates({
      aggregates: [{ fn: 'count' }, { column: 'total_amount', fn: 'sum' }],
      columnAxis: { key: 'year', values: [2022, 2023] },
    });

    expect(expanded.map((entry) => entry.alias)).toEqual([
      'count_rows_c0',
      'sum_total_amount_c0',
      'count_rows_c1',
      'sum_total_amount_c1',
    ]);
  });

  it('keeps an aggregate filter and ANDs the axis predicate onto it', () => {
    expect(
      expandColumnAxisAggregates({
        aggregates: [
          {
            column: 'total_amount',
            filters: [{ column: 'is_gift', operator: 'eq', value: true }],
            fn: 'sum',
          },
        ],
        columnAxis: { key: 'order_status', values: ['Pending'] },
      })[0]?.filters,
    ).toEqual([
      { column: 'is_gift', operator: 'eq', value: true },
      { column: 'order_status', operator: 'eq', value: 'Pending' },
    ]);
  });

  it('projects nothing when the axis has no values', () => {
    expect(
      expandColumnAxisAggregates({
        aggregates: [{ fn: 'count' }],
        columnAxis: { key: 'order_status', values: [] },
      }),
    ).toEqual([]);
  });
});
