import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { removeTableColumnAggregate } from './removeTableColumnAggregate.util';

type GroupingArgs = {
  readonly aggregates?: TableGroupingState['aggregates'];
  readonly shares?: TableGroupingState['shares'];
};

const grouping = ({
  aggregates = [
    { columnKey: 'total_amount', fn: 'sum' },
    { columnKey: 'total_amount', fn: 'avg' },
    { columnKey: 'quantity', fn: 'count' },
  ],
  shares = [],
}: GroupingArgs = {}): TableGroupingState => ({
  aggregates,
  keys: ['order_status'],
  mode: 'flat',
  periods: { created_at: 'month' },
  shares,
});

describe('removeTableColumnAggregate', () => {
  it('removes exactly the named pair and leaves the column its others', () => {
    expect(
      removeTableColumnAggregate({
        columnKey: 'total_amount',
        fn: 'avg',
        grouping: grouping(),
      }).aggregates,
    ).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum' },
      { columnKey: 'quantity', fn: 'count' },
    ]);
  });

  it('clears every aggregate on the column when no function is named', () => {
    expect(
      removeTableColumnAggregate({
        columnKey: 'total_amount',
        grouping: grouping(),
      }).aggregates,
    ).toStrictEqual([{ columnKey: 'quantity', fn: 'count' }]);
  });

  it('leaves the order of the survivors alone', () => {
    expect(
      removeTableColumnAggregate({
        columnKey: 'total_amount',
        fn: 'sum',
        grouping: grouping(),
      }).aggregates.map(({ fn }) => fn),
    ).toStrictEqual(['avg', 'count']);
  });

  it('answers with an unchanged list for a pair that is not applied', () => {
    expect(
      removeTableColumnAggregate({
        columnKey: 'total_amount',
        fn: 'min',
        grouping: grouping(),
      }).aggregates,
    ).toStrictEqual(grouping().aggregates);
  });

  it('prunes only the removed measure share', () => {
    // Both measures on one column are shareable, so a column-keyed share could
    // not have told these two apart (#831).
    expect(
      removeTableColumnAggregate({
        columnKey: 'total_amount',
        fn: 'sum',
        grouping: grouping({
          aggregates: [
            { columnKey: 'total_amount', fn: 'sum' },
            { columnKey: 'total_amount', fn: 'count' },
          ],
          shares: [
            { columnKey: 'total_amount', fn: 'sum' },
            { columnKey: 'total_amount', fn: 'count' },
          ],
        }),
      }).shares,
    ).toStrictEqual([{ columnKey: 'total_amount', fn: 'count' }]);
  });

  it('does not mutate the state it was handed', () => {
    const before = grouping();

    removeTableColumnAggregate({
      columnKey: 'total_amount',
      grouping: before,
    });

    expect(before.aggregates).toHaveLength(3);
  });
});
