import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { toAggregateItems } from './toAggregateItems.util';

type TestRow = {
  readonly order_status: string;
  readonly quantity: number;
  readonly total_amount: number;
};

const columns: TableColumn<TestRow>[] = [
  { key: 'order_status', label: 'Status' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'total_amount', label: 'Total' },
];

describe('toAggregateItems', () => {
  it('labels an aggregate by its function and its column', () => {
    expect(
      toAggregateItems({ aggregates: { total_amount: 'sum' }, columns }),
    ).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum', label: 'Sum of Total' },
    ]);
  });

  it('lists them in column order rather than in map order', () => {
    // Written most-recently-added first, so insertion order and column order
    // disagree — which is what makes this assertion discriminating.
    expect(
      toAggregateItems({
        aggregates: { quantity: 'max', total_amount: 'sum' },
        columns,
      }).map(({ columnKey }) => columnKey),
    ).toStrictEqual(['quantity', 'total_amount']);
  });

  it('drops an aggregate on a column this route does not declare', () => {
    expect(
      toAggregateItems({ aggregates: { not_a_column: 'sum' }, columns }),
    ).toStrictEqual([]);
  });

  it('answers empty when nothing is selected', () => {
    expect(toAggregateItems({ aggregates: {}, columns })).toStrictEqual([]);
  });
});
