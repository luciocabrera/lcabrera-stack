import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { toDeclaredColumnKey } from './toDeclaredColumnKey.util';

type Row = {
  readonly customer_type: string;
  readonly total_amount: number;
};

const columns = [
  { key: 'customer_type', label: 'Customer Type' },
  { dataType: 'number', key: 'total_amount', label: 'Total Amount' },
] as TableColumn<Row>[];

describe('toDeclaredColumnKey', () => {
  it('resolves a measure column to the column it measures', () => {
    expect(
      toDeclaredColumnKey<Row>({ columnKey: 'total_amount:avg', columns }),
    ).toBe('total_amount');
  });

  it('passes a declared column through unchanged', () => {
    expect(
      toDeclaredColumnKey<Row>({ columnKey: 'customer_type', columns }),
    ).toBe('customer_type');
  });

  it('passes the actions column through', () => {
    expect(toDeclaredColumnKey<Row>({ columnKey: 'actions', columns })).toBe(
      'actions',
    );
  });

  it('prefers a real column over the token grammar', () => {
    const literal = [
      ...columns,
      { key: 'total_amount:avg', label: 'Odd' },
    ] as TableColumn<Row>[];

    expect(
      toDeclaredColumnKey<Row>({
        columnKey: 'total_amount:avg',
        columns: literal,
      }),
    ).toBe('total_amount:avg');
  });

  it('leaves a token whose source column is not declared alone', () => {
    expect(
      toDeclaredColumnKey<Row>({
        columnKey: 'not_a_column:avg' as never,
        columns,
      }),
    ).toBe('not_a_column:avg');
  });

  it('leaves a key whose suffix is not an aggregate function alone', () => {
    expect(
      toDeclaredColumnKey<Row>({
        columnKey: 'total_amount:nope' as never,
        columns,
      }),
    ).toBe('total_amount:nope');
  });
});
