import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveAggregateColumnLabel } from './resolveAggregateColumnLabel.util';

type Row = {
  readonly region: string;
  readonly total_amount: number;
};

const columns: readonly TableColumn<Row>[] = [
  { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
  { key: 'region', label: 'Region' },
];

const run = (columnKey: string) =>
  resolveAggregateColumnLabel<Row>({ columnKey, columns });

describe('resolveAggregateColumnLabel', () => {
  it('reads a measure token as the function and the column it measures', () => {
    expect(run('total_amount:min')).toBe('Minimum of Total Amount');
    expect(run('total_amount:avg')).toBe('Average of Total Amount');
  });

  it('answers nothing for a declared column, which has its own label', () => {
    expect(run('total_amount')).toBeUndefined();
    expect(run('region')).toBeUndefined();
  });

  it('answers nothing for a key that is not a token at all', () => {
    expect(run('actions')).toBeUndefined();
    expect(run('not_a_column')).toBeUndefined();
  });

  it('answers nothing for a token whose function is not one we know', () => {
    expect(run('total_amount:median')).toBeUndefined();
  });

  it('prefers the declared column when one is literally named like a token', () => {
    expect(
      resolveAggregateColumnLabel<Row>({
        columnKey: 'total_amount:min',
        columns: [
          ...columns,
          { key: 'total_amount:min' as never, label: 'Odd' },
        ],
      }),
    ).toBeUndefined();
  });

  it('falls back to the source key when the measured column is undeclared', () => {
    expect(run('gone:sum')).toBe('Sum of gone');
  });
});
