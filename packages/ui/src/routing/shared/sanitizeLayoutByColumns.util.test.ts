import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  SortingState,
  TableColumn,
} from '#ui/components/Table';

import { sanitizeLayoutByColumns } from './sanitizeLayoutByColumns.util';

type Row = {
  readonly amount: number;
  readonly name: string;
  readonly status: string;
};

const columns: readonly TableColumn<Row>[] = [
  { dataType: 'string', key: 'status', label: 'Status' },
  { dataType: 'string', key: 'name', label: 'Name' },
  { dataType: 'number', key: 'amount', label: 'Amount' },
];

const layout = {
  columnOrder: ['status', 'gone', 'amount'] as unknown as ColumnOrderState<Row>,
  columnPinning: {
    left: ['gone', 'status'],
    right: ['amount', 'missing'],
  } as unknown as ColumnPinningState<Row>,
  columnSizing: {
    amount: 180,
    gone: 40,
    status: 120,
  } as unknown as ColumnSizingState<Row>,
  columnVisibility: new Set([
    'gone',
    'status',
  ]) as unknown as ColumnVisibilityState<Row>,
  sorting: [
    { columnKey: 'gone', direction: 'asc' },
    { columnKey: 'amount', direction: 'desc' },
  ] as unknown as SortingState<Row>,
};

describe('sanitizeLayoutByColumns', () => {
  it('drops a key that is not in columns from every layout slice', () => {
    const result = sanitizeLayoutByColumns({ columns, ...layout });

    expect(result.columnOrder).toEqual(['status', 'amount']);
    expect(result.columnPinning).toEqual({
      left: ['status'],
      right: ['amount'],
    });
    expect(result.columnSizing).toEqual({ amount: 180, status: 120 });
    expect(result.columnVisibility).toEqual(new Set(['status']));
    expect(result.sorting).toEqual([
      { columnKey: 'amount', direction: 'desc' },
    ]);
  });

  it('returns empty slices when every key is absent from columns', () => {
    const result = sanitizeLayoutByColumns({
      columnOrder: ['gone'] as unknown as ColumnOrderState<Row>,
      columnPinning: {
        left: ['gone'],
        right: ['missing'],
      } as unknown as ColumnPinningState<Row>,
      columns,
      columnSizing: { gone: 40 } as unknown as ColumnSizingState<Row>,
      columnVisibility: new Set([
        'gone',
      ]) as unknown as ColumnVisibilityState<Row>,
      sorting: [
        { columnKey: 'gone', direction: 'asc' },
      ] as unknown as SortingState<Row>,
    });

    expect(result).toEqual({
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      columnSizing: {},
      columnVisibility: new Set(),
      sorting: [],
    });
  });

  it('keeps keys that match the column set', () => {
    const result = sanitizeLayoutByColumns({
      columnOrder: ['amount', 'status'] as ColumnOrderState<Row>,
      columnPinning: {
        left: ['status'],
        right: ['amount'],
      } as ColumnPinningState<Row>,
      columns,
      columnSizing: { amount: 180 } as ColumnSizingState<Row>,
      columnVisibility: new Set([
        'amount',
        'name',
      ]) as ColumnVisibilityState<Row>,
      sorting: [{ columnKey: 'status', direction: 'asc' }] as SortingState<Row>,
    });

    expect(result.columnOrder).toEqual(['amount', 'status']);
    expect(result.columnPinning).toEqual({
      left: ['status'],
      right: ['amount'],
    });
    expect(result.columnSizing).toEqual({ amount: 180 });
    expect(result.columnVisibility).toEqual(new Set(['amount', 'name']));
    expect(result.sorting).toEqual([{ columnKey: 'status', direction: 'asc' }]);
  });

  it('fills a missing pinning side instead of throwing', () => {
    const result = sanitizeLayoutByColumns({
      columnOrder: [] as ColumnOrderState<Row>,
      columnPinning: { left: ['status'] } as unknown as ColumnPinningState<Row>,
      columns,
      columnSizing: {} as ColumnSizingState<Row>,
      columnVisibility: new Set() as ColumnVisibilityState<Row>,
      sorting: [],
    });

    expect(result.columnPinning).toEqual({ left: ['status'], right: [] });
  });

  it('does not throw when a cookie slice is the wrong JSON type', () => {
    const result = sanitizeLayoutByColumns({
      columnOrder: 'x' as unknown as ColumnOrderState<Row>,
      columnPinning: 'x' as unknown as ColumnPinningState<Row>,
      columns,
      columnSizing: JSON.parse('null') as ColumnSizingState<Row>,
      columnVisibility: 'x' as unknown as ColumnVisibilityState<Row>,
      sorting: 'x' as unknown as SortingState<Row>,
    });

    expect(result.columnOrder).toEqual([]);
    expect(result.columnPinning.left).toEqual([]);
    expect(result.columnPinning.right).toEqual([]);
    expect(result.columnSizing).toEqual({});
    expect(result.columnVisibility.size).toBe(0);
    expect(result.sorting).toEqual([]);
  });
});
