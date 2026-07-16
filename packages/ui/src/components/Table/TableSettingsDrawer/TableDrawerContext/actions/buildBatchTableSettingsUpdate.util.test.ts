import type {
  ColumnFiltersState,
  ColumnSizingState,
  SortingState,
} from '@repo/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

import { buildBatchTableSettingsUpdate } from './buildBatchTableSettingsUpdate.util';

type Row = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

describe('buildBatchTableSettingsUpdate', () => {
  it('returns the current drawer state when all slices are present', () => {
    const columnFilters = {
      name: { operator: 'contains', type: 'text', value: 'ali' },
    } as ColumnFiltersState<Row>;
    const columnSizing = {
      actions: 0,
      age: 80,
      id: 120,
      name: 160,
    } as ColumnSizingState<Row>;
    const sorting = [
      { columnKey: 'name', direction: 'asc' },
    ] as SortingState<Row>;
    const columnVisibility = new Set<'actions' | 'age' | 'id' | 'name'>([
      'age',
    ]);

    const result = buildBatchTableSettingsUpdate<Row>({
      columnFilters,
      columnOrder: ['id', 'name', 'age'],
      columnPinning: { left: ['id'], right: [] },
      columnSizing,
      columnVisibility,
      sorting,
    });

    expect(result).toEqual({
      columnFilters,
      columnOrder: ['id', 'name', 'age'],
      columnPinning: { left: ['id'], right: [] },
      columnSizing,
      columnVisibility,
      sorting,
    });
  });

  it('falls back to empty state slices when the drawer store is unset', () => {
    const result = buildBatchTableSettingsUpdate<Row>();

    expect(result.columnFilters).toEqual({});
    expect(result.columnOrder).toEqual([]);
    expect(result.columnPinning).toEqual({ left: [], right: [] });
    expect(result.columnSizing).toEqual({});
    expect(result.columnVisibility).toEqual(new Set());
    expect(result.sorting).toEqual([]);
  });
});
