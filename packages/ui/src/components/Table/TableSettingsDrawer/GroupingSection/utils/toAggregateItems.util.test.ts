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
      toAggregateItems({
        aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
        columns,
      }),
    ).toStrictEqual([
      {
        columnKey: 'total_amount',
        fn: 'sum',
        id: 'total_amount:sum',
        label: 'Sum of Total',
      },
    ]);
  });

  it('emits a row per aggregate, so one column may appear twice', () => {
    expect(
      toAggregateItems({
        aggregates: [
          { columnKey: 'total_amount', fn: 'avg' },
          { columnKey: 'total_amount', fn: 'min' },
        ],
        columns,
      }).map(({ label }) => label),
    ).toStrictEqual(['Average of Total', 'Minimum of Total']);
  });

  it('gives each row an id unique per entry, not per column', () => {
    const ids = toAggregateItems({
      aggregates: [
        { columnKey: 'total_amount', fn: 'avg' },
        { columnKey: 'total_amount', fn: 'min' },
      ],
      columns,
    }).map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lists them in staged order rather than in column order', () => {
    expect(
      toAggregateItems({
        aggregates: [
          { columnKey: 'total_amount', fn: 'sum' },
          { columnKey: 'quantity', fn: 'max' },
        ],
        columns,
      }).map(({ columnKey }) => columnKey),
    ).toStrictEqual(['total_amount', 'quantity']);
  });

  it('drops an aggregate on a column this route does not declare', () => {
    expect(
      toAggregateItems({
        aggregates: [{ columnKey: 'not_a_column', fn: 'sum' }],
        columns,
      }),
    ).toStrictEqual([]);
  });

  it('answers empty when nothing is selected', () => {
    expect(toAggregateItems({ aggregates: [], columns })).toStrictEqual([]);
  });
});
