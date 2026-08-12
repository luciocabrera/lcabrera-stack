import { describe, expect, it } from 'vite-plus/test';

import type { TableColumnsState } from '#ui/components/Table/Table.types';

import { getTableColumnDrawerState } from './getTableColumnDrawerState.util';

describe('getTableColumnDrawerState (ColumnDrawerContext)', () => {
  it('maps filter, sizing, sorting, and pinning for a column', () => {
    const columnsState = {
      columnFilters: {
        name: {
          operator: 'contains',
          type: 'text',
          value: 'ali',
        },
      },
      columnPinning: {
        left: ['name'],
        right: [],
      },
      columnSizing: {
        name: 220,
      },
      sorting: [
        {
          columnKey: 'name',
          direction: 'asc',
        },
      ],
    } as unknown as TableColumnsState<Record<string, unknown>>;

    const result = getTableColumnDrawerState({
      columnKey: 'name',
      columnsState,
    });

    expect(result.columnFilter).toEqual({
      operator: 'contains',
      type: 'text',
      value: 'ali',
    });
    expect(result.columnPinning).toBe('left');
    expect(result.columnSizing).toBe(220);
    expect(result.sorting).toBe('asc');
  });

  it('returns undefined values when column is not configured in table state', () => {
    const columnsState = {
      columnFilters: {},
      columnPinning: {
        left: [],
        right: [],
      },
      columnSizing: {},
      sorting: [],
    } as unknown as TableColumnsState<Record<string, unknown>>;

    const result = getTableColumnDrawerState({
      columnKey: 'name',
      columnsState,
    });

    expect(result.columnFilter).toBeUndefined();
    expect(result.columnPinning).toBeUndefined();
    expect(result.columnSizing).toBeUndefined();
    expect(result.sorting).toBeUndefined();
  });
});
