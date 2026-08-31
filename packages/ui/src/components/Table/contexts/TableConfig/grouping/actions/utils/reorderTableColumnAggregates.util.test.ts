import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { reorderTableColumnAggregates } from './reorderTableColumnAggregates.util';

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

describe('reorderTableColumnAggregates', () => {
  it('puts the aggregates in the order the ids name', () => {
    expect(
      reorderTableColumnAggregates({
        grouping: grouping({
          aggregates: [
            { columnKey: 'subtotal', fn: 'avg' },
            { columnKey: 'total_amount', fn: 'min' },
          ],
        }),
        orderedIds: ['total_amount:min', 'subtotal:avg'],
      }).aggregates,
    ).toStrictEqual([
      { columnKey: 'total_amount', fn: 'min' },
      { columnKey: 'subtotal', fn: 'avg' },
    ]);
  });

  it('moves one measure of a column past the other, which is what a map could not express', () => {
    expect(
      reorderTableColumnAggregates({
        grouping: grouping({
          aggregates: [
            { columnKey: 'total_amount', fn: 'avg' },
            { columnKey: 'quantity', fn: 'max' },
            { columnKey: 'total_amount', fn: 'sum' },
          ],
        }),
        orderedIds: ['total_amount:sum', 'total_amount:avg', 'quantity:max'],
      }).aggregates,
    ).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum' },
      { columnKey: 'total_amount', fn: 'avg' },
      { columnKey: 'quantity', fn: 'max' },
    ]);
  });

  it('reads a column key that contains the separator', () => {
    expect(
      reorderTableColumnAggregates({
        grouping: grouping({
          aggregates: [
            { columnKey: 'quantity', fn: 'max' },
            { columnKey: 'odd:col', fn: 'sum' },
          ],
        }),
        orderedIds: ['odd:col:sum', 'quantity:max'],
      }).aggregates,
    ).toStrictEqual([
      { columnKey: 'odd:col', fn: 'sum' },
      { columnKey: 'quantity', fn: 'max' },
    ]);
  });

  it('keeps an aggregate the ids do not name rather than dropping it', () => {
    expect(
      reorderTableColumnAggregates({
        grouping: grouping({
          aggregates: [
            { columnKey: 'not_a_column', fn: 'sum' },
            { columnKey: 'quantity', fn: 'max' },
            { columnKey: 'total_amount', fn: 'avg' },
          ],
        }),
        orderedIds: ['total_amount:avg', 'quantity:max'],
      }).aggregates,
    ).toStrictEqual([
      { columnKey: 'total_amount', fn: 'avg' },
      { columnKey: 'quantity', fn: 'max' },
      { columnKey: 'not_a_column', fn: 'sum' },
    ]);
  });

  it('ignores an id that names no staged aggregate', () => {
    expect(
      reorderTableColumnAggregates({
        grouping: grouping({
          aggregates: [{ columnKey: 'quantity', fn: 'max' }],
        }),
        orderedIds: ['total_amount:sum', 'quantity:max'],
      }).aggregates,
    ).toStrictEqual([{ columnKey: 'quantity', fn: 'max' }]);
  });

  it('leaves the keys, mode, periods and shares alone', () => {
    const before = grouping({
      aggregates: [
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'quantity', fn: 'count' },
      ],
      shares: [{ columnKey: 'total_amount', fn: 'sum' }],
    });

    const after = reorderTableColumnAggregates({
      grouping: before,
      orderedIds: ['quantity:count', 'total_amount:sum'],
    });

    expect(after.keys).toStrictEqual(before.keys);
    expect(after.mode).toBe(before.mode);
    expect(after.periods).toStrictEqual(before.periods);
    expect(after.shares).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum' },
    ]);
  });

  it('does not mutate the state it was handed', () => {
    const before = grouping({
      aggregates: [
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'quantity', fn: 'max' },
      ],
    });

    reorderTableColumnAggregates({
      grouping: before,
      orderedIds: ['quantity:max', 'total_amount:sum'],
    });

    expect(before.aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum' },
      { columnKey: 'quantity', fn: 'max' },
    ]);
  });
});
