import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '../Table.types';

import { expandAxisAggregateColumns } from './expandAxisAggregateColumns.util';

type Row = {
  readonly customer_type: string;
  readonly quantity: number;
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
    expect(result.columns[1]?.isSortable).toBe(false);
    expect(result.columns[1]?.headerGroupLabel).toBeUndefined();
  });

  it('hides only the aliases of the measured column that was hidden', () => {
    const twoMeasures: readonly TableColumn<Row>[] = [
      { key: 'customer_type', label: 'Customer Type' },
      { dataType: 'currency', key: 'total_amount', label: 'Total Amount' },
      { dataType: 'number', key: 'quantity', label: 'Quantity' },
    ];

    const result = expandAxisAggregateColumns<Row>({
      aggregates: [
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'quantity', fn: 'sum' },
      ],
      columnOrder: ['customer_type', 'total_amount', 'quantity'] as never,
      columnPinning: { left: [], right: [] },
      columns: twoMeasures,
      columnVisibility: new Set(['total_amount']) as never,
      emitted: [
        {
          alias: 'sum_total_amount_c0',
          axis: { value: 'Pending' },
          columnKey: 'total_amount',
          fn: 'sum',
        },
        {
          alias: 'sum_quantity_c0',
          axis: { value: 'Pending' },
          columnKey: 'quantity',
          fn: 'sum',
        },
        {
          alias: 'sum_total_amount_c1',
          axis: { value: 'Shipped' },
          columnKey: 'total_amount',
          fn: 'sum',
        },
        {
          alias: 'sum_quantity_c1',
          axis: { value: 'Shipped' },
          columnKey: 'quantity',
          fn: 'sum',
        },
      ],
      groupingKeys: ['customer_type'],
    });

    expect([...result.columnVisibility]).toStrictEqual([
      'sum_total_amount_c0',
      'sum_total_amount_c1',
    ]);
    expect(result.columns.map((column) => String(column.key))).toStrictEqual([
      'customer_type',
      'sum_total_amount_c0',
      'sum_total_amount_c1',
      'sum_quantity_c0',
      'sum_quantity_c1',
    ]);
    expect(
      result.columns.slice(1).map((column) => ({
        headerGroupLabel: column.headerGroupLabel,
        label: column.label,
      })),
    ).toStrictEqual([
      { headerGroupLabel: 'Total Amount', label: 'Sum · Pending' },
      { headerGroupLabel: 'Total Amount', label: 'Sum · Shipped' },
      { headerGroupLabel: 'Quantity', label: 'Sum · Pending' },
      { headerGroupLabel: 'Quantity', label: 'Sum · Shipped' },
    ]);
  });
});
