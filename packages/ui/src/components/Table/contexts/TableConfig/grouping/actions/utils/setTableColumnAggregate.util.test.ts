import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { setTableColumnAggregate } from './setTableColumnAggregate.util';

const GROUPED: TableGroupingState = {
  aggregates: {},
  keys: ['order_status'],
  mode: 'flat',
  periods: {},
  shares: [],
};

describe('setTableColumnAggregate', () => {
  it('applies an aggregate to a column', () => {
    expect(
      setTableColumnAggregate({
        columnKey: 'total_amount',
        fn: 'sum',
        grouping: GROUPED,
      }),
    ).toStrictEqual({
      aggregates: { total_amount: 'sum' },
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('replaces the aggregate on a column rather than accumulating one per function', () => {
    // One aggregate per column is the whole shape the compact URL param can
    // carry, so a second selection on the same column has to displace the first.
    expect(
      setTableColumnAggregate({
        columnKey: 'total_amount',
        fn: 'avg',
        grouping: {
          aggregates: { total_amount: 'sum' },
          keys: ['a'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }).aggregates,
    ).toStrictEqual({ total_amount: 'avg' });
  });

  it('clears one column without disturbing the others', () => {
    expect(
      setTableColumnAggregate({
        columnKey: 'total_amount',
        fn: undefined,
        grouping: {
          aggregates: { quantity: 'max', total_amount: 'sum' },
          keys: ['a'],
          mode: 'flat',
          periods: {},
          shares: [],
        },
      }).aggregates,
    ).toStrictEqual({ quantity: 'max' });
  });

  it('leaves no cleared column behind for Object.keys to report', () => {
    const { aggregates } = setTableColumnAggregate({
      columnKey: 'total_amount',
      fn: undefined,
      grouping: {
        aggregates: { total_amount: 'sum' },
        keys: ['a'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
    });

    expect(Object.keys(aggregates)).toStrictEqual([]);
  });

  it('never mutates the map it was handed', () => {
    const aggregates = { total_amount: 'sum' } as const;

    setTableColumnAggregate({
      columnKey: 'quantity',
      fn: 'max',
      grouping: {
        aggregates,
        keys: ['a'],
        mode: 'flat',
        periods: {},
        shares: [],
      },
    });

    expect(aggregates).toStrictEqual({ total_amount: 'sum' });
  });

  it('leaves the group keys alone', () => {
    expect(
      setTableColumnAggregate({
        columnKey: 'total_amount',
        fn: 'sum',
        grouping: GROUPED,
      }).keys,
    ).toStrictEqual(['order_status']);
  });
});
