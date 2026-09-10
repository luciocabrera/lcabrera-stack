import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '../Table.types';

import { expandAxisAggregateColumns } from './expandAxisAggregateColumns.util';

type Row = {
  readonly customer_type: string;
  readonly total_amount: number;
};

const columns: readonly TableColumn<Row>[] = [
  { key: 'customer_type', label: 'Customer Type' },
  { dataType: 'currency', key: 'total_amount', label: 'Total Amount' },
];

describe('expandAxisAggregateColumns', () => {
  it('replaces the measured column with one column per emitted alias', () => {
    const result = expandAxisAggregateColumns<Row>({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      columnOrder: ['customer_type', 'total_amount'] as never,
      columnPinning: { left: [], right: [] },
      columns,
      columnVisibility: new Set(),
      emitted: [
        {
          alias: 'sum_total_amount_c0',
          axis: { value: 'Pending' },
          columnKey: 'total_amount',
          fn: 'sum',
        },
      ],
      groupingKeys: ['customer_type'],
    });

    expect(result.columns.map((column) => String(column.key))).toStrictEqual([
      'customer_type',
      'sum_total_amount_c0',
    ]);
    expect(result.columns[1]?.label).toBe('Pending');
  });
});
