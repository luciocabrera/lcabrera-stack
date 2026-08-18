import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { withGroupedColumnLayout } from './withGroupedColumnLayout.util';

type Row = {
  readonly amount: number;
  readonly city: string;
  readonly district: string;
  readonly id: number;
};

const columns: TableColumn<Row>[] = [
  { key: 'id', label: 'Id' },
  { key: 'amount', label: 'Amount' },
  { key: 'city', label: 'City' },
  { key: 'district', label: 'District' },
];

const layout = (groupingKeys: readonly string[], overrides = {}) =>
  withGroupedColumnLayout<Row>({
    columnOrder: ['id', 'amount', 'city', 'district'],
    columnPinning: { left: ['id'], right: [] },
    columns,
    columnVisibility: new Set(),
    groupingKeys,
    ...overrides,
  });

describe('withGroupedColumnLayout', () => {
  it('returns every input untouched while nothing is grouped', () => {
    const result = layout([]);

    expect(result.columnOrder).toStrictEqual([
      'id',
      'amount',
      'city',
      'district',
    ]);
    expect(result.columnPinning).toStrictEqual({ left: ['id'], right: [] });
  });

  it('hoists the keys to the head of the order and the left pin, in key order', () => {
    const result = layout(['district', 'city']);

    expect(result.columnOrder).toStrictEqual([
      'district',
      'city',
      'id',
      'amount',
    ]);
    expect(result.columnPinning.left).toStrictEqual(['district', 'city', 'id']);
  });

  it('adds no column of its own', () => {
    expect(layout(['city']).columns).toBe(columns);
  });

  it('moves a key out of the right pin rather than leaving it in both', () => {
    const result = layout(['city'], {
      columnPinning: { left: [], right: ['city', 'amount'] },
    });

    expect(result.columnPinning.left).toStrictEqual(['city']);
    expect(result.columnPinning.right).toStrictEqual(['amount']);
  });

  it('does not duplicate a key already pinned left', () => {
    const result = layout(['id']);

    expect(result.columnPinning.left).toStrictEqual(['id']);
    expect(result.columnOrder).toStrictEqual([
      'id',
      'amount',
      'city',
      'district',
    ]);
  });

  it('forces a hidden key visible', () => {
    // Under one column per key a hidden key erases a level rather than merely
    // hiding a column, because the depth signal is which columns are filled.
    const result = layout(['city'], {
      columnVisibility: new Set(['city', 'amount']),
    });

    expect([...result.columnVisibility]).toStrictEqual(['amount']);
  });

  it('keeps the caller’s visibility set when no key is hidden', () => {
    // Reallocating on every grouped render would churn the memo below it.
    const columnVisibility = new Set<'amount'>(['amount']);

    expect(layout(['city'], { columnVisibility }).columnVisibility).toBe(
      columnVisibility,
    );
  });

  it('skips a key naming no declared column', () => {
    const result = layout(['not_a_column']);

    expect(result.columnOrder).toStrictEqual([
      'id',
      'amount',
      'city',
      'district',
    ]);
    expect(result.columnPinning).toStrictEqual({ left: ['id'], right: [] });
  });

  it('hoists the keys it can when only some name a declared column', () => {
    expect(layout(['not_a_column', 'city']).columnOrder).toStrictEqual([
      'city',
      'id',
      'amount',
      'district',
    ]);
  });
});
