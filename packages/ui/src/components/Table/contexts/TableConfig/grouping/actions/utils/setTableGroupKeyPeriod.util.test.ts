import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { setTableGroupKeyPeriod } from './setTableGroupKeyPeriod.util';

const grouping: TableGroupingState = {
  aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
  keys: ['order_date', 'status'],
  mode: 'rollup',
  periods: { order_date: 'month' },
  shares: [],
};

describe('setTableGroupKeyPeriod', () => {
  it('sets a granularity on one key and leaves the rest of the state alone', () => {
    expect(
      setTableGroupKeyPeriod({
        columnKey: 'order_date',
        grouping,
        period: 'quarter',
      }),
    ).toStrictEqual({ ...grouping, periods: { order_date: 'quarter' } });
  });

  it('clears one by leaving no entry behind, not an undefined value', () => {
    // The server refuses a granularity map naming a column that is not a group
    // key, and an `undefined` entry still has a key — so `delete`-shaped
    // clearing would send a map with a member the request must not carry.
    const next = setTableGroupKeyPeriod({
      columnKey: 'order_date',
      grouping,
      period: undefined,
    });

    expect(next.periods).toStrictEqual({});
    expect(Object.keys(next.periods)).toStrictEqual([]);
  });

  it('never mutates the state it was handed', () => {
    setTableGroupKeyPeriod({
      columnKey: 'order_date',
      grouping,
      period: 'year',
    });

    expect(grouping.periods).toStrictEqual({ order_date: 'month' });
  });

  it('leaves another key’s granularity in place', () => {
    expect(
      setTableGroupKeyPeriod({
        columnKey: 'status',
        grouping,
        period: 'day',
      }).periods,
    ).toStrictEqual({ order_date: 'month', status: 'day' });
  });
});
