import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { addTableColumnAggregate } from './addTableColumnAggregate.util';

type GroupingArgs = {
  readonly aggregates?: TableGroupingState['aggregates'];
  readonly shares?: TableGroupingState['shares'];
};

const grouping = ({
  aggregates = [],
  shares = [],
}: GroupingArgs = {}): TableGroupingState => ({
  aggregates,
  keys: ['order_status'],
  mode: 'flat',
  periods: { created_at: 'month' },
  shares,
});

describe('addTableColumnAggregate', () => {
  it('applies an aggregate to a column that had none', () => {
    expect(
      addTableColumnAggregate({
        columnKey: 'total_amount',
        fn: 'sum',
        grouping: grouping(),
      }).aggregates,
    ).toStrictEqual([{ columnKey: 'total_amount', fn: 'sum' }]);
  });

  it('adds a second function to a column that already carries one', () => {
    expect(
      addTableColumnAggregate({
        columnKey: 'total_amount',
        fn: 'min',
        grouping: grouping({
          aggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
        }),
      }).aggregates,
    ).toStrictEqual([
      { columnKey: 'total_amount', fn: 'avg' },
      { columnKey: 'total_amount', fn: 'min' },
    ]);
  });

  it('appends rather than inserting, so the staged order is the user order', () => {
    const first = addTableColumnAggregate({
      columnKey: 'total_amount',
      fn: 'sum',
      grouping: grouping(),
    });

    expect(
      addTableColumnAggregate({
        columnKey: 'quantity',
        fn: 'max',
        grouping: first,
      }).aggregates,
    ).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum' },
      { columnKey: 'quantity', fn: 'max' },
    ]);
  });

  it('refuses to repeat a pair that is already applied', () => {
    const before = grouping({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
    });

    const after = addTableColumnAggregate({
      columnKey: 'total_amount',
      fn: 'sum',
      grouping: before,
    });

    expect(after.aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum' },
    ]);
    expect(after).toBe(before);
  });

  it('leaves the keys, mode, periods and shares alone', () => {
    const before = grouping({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      shares: [{ columnKey: 'total_amount', fn: 'sum' }],
    });

    const after = addTableColumnAggregate({
      columnKey: 'quantity',
      fn: 'max',
      grouping: before,
    });

    expect(after.keys).toStrictEqual(before.keys);
    expect(after.mode).toBe(before.mode);
    expect(after.periods).toStrictEqual(before.periods);
    expect(after.shares).toStrictEqual(before.shares);
  });

  it('does not mutate the state it was handed', () => {
    const before = grouping({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
    });

    addTableColumnAggregate({
      columnKey: 'total_amount',
      fn: 'avg',
      grouping: before,
    });

    expect(before.aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum' },
    ]);
  });
});

describe('where a new aggregate lands', () => {
  it('sits beside the column’s existing measures rather than at the tail', () => {
    const result = addTableColumnAggregate({
      columnKey: 'total_amount',
      fn: 'sum',
      grouping: grouping({
        aggregates: [
          { columnKey: 'total_amount', fn: 'min' },
          { columnKey: 'order_no', fn: 'count' },
        ],
      }),
    });

    expect(result.aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'min' },
      { columnKey: 'total_amount', fn: 'sum' },
      { columnKey: 'order_no', fn: 'count' },
    ]);
  });

  it('goes to the tail when the column carries none yet', () => {
    const result = addTableColumnAggregate({
      columnKey: 'order_no',
      fn: 'count',
      grouping: grouping({
        aggregates: [{ columnKey: 'total_amount', fn: 'min' }],
      }),
    });

    expect(result.aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'min' },
      { columnKey: 'order_no', fn: 'count' },
    ]);
  });
});
