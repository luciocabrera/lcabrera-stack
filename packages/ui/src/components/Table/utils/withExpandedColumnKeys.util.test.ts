import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '../Table.types';

import { withExpandedColumnKeys } from './withExpandedColumnKeys.util';

type Row = {
  readonly amount: number;
  readonly id: number;
};

const columns: readonly TableColumn<Row>[] = [
  { key: 'id', label: 'Id' },
  { key: 'amount', label: 'Amount' },
];

describe('withExpandedColumnKeys', () => {
  it('replaces a key with the aliases expandKey returns', () => {
    const result = withExpandedColumnKeys<Row>({
      columnOrder: ['id', 'amount'] as never,
      columnPinning: { left: ['amount'] as never, right: [] },
      columns,
      columnVisibility: new Set(['amount']) as never,
      expandColumn: (column) =>
        column.key === 'amount'
          ? [{ key: 'sum_amount' as never, label: 'Sum' }]
          : [column],
      expandKey: (key) =>
        key === 'amount' ? (['sum_amount'] as never) : [key],
    });

    expect(result.columnOrder).toStrictEqual(['id', 'sum_amount']);
    expect(result.columnPinning.left).toStrictEqual(['sum_amount']);
    expect([...result.columnVisibility]).toStrictEqual(['sum_amount']);
    expect(result.columns.map((column) => String(column.key))).toStrictEqual([
      'id',
      'sum_amount',
    ]);
  });
});
