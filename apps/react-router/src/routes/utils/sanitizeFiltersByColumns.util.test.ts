import { describe, expect, it } from 'vitest';

import type { ColumnFiltersState, TableColumn } from '@/components/Table';
import type { ColumnFilter } from '@/types/filterOperators.types';

import { sanitizeFiltersByColumns } from './sanitizeFiltersByColumns.util';

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

describe('sanitizeFiltersByColumns', () => {
  it('keeps filters that match the column data type', () => {
    const result = sanitizeFiltersByColumns({
      columns,
      filters: {
        amount: { operator: 'greaterThan', type: 'number', value: 100 },
        status: { operator: 'equals', type: 'select', value: 'active' },
      } as ColumnFiltersState<Row>,
    });

    expect(result).toEqual({
      amount: { operator: 'greaterThan', type: 'number', value: 100 },
      status: { operator: 'equals', type: 'select', value: 'active' },
    });
  });

  it('drops filters with incompatible types', () => {
    const result = sanitizeFiltersByColumns({
      columns,
      filters: {
        // correct match — should be kept
        amount: { operator: 'equals', type: 'number', value: 42 },
        // number filter on a string column — should be dropped
        status: { operator: 'equals', type: 'number', value: 42 },
      } as ColumnFiltersState<Row>,
    });

    expect(result).toEqual({
      amount: { operator: 'equals', type: 'number', value: 42 },
    });
  });

  it('drops filters for unknown column keys', () => {
    const result = sanitizeFiltersByColumns({
      columns,
      filters: {
        status: { operator: 'contains', type: 'text', value: 'active' },
        // 'unknown' is not in columns
        unknown: { operator: 'contains', type: 'text', value: 'foo' },
      } as unknown as ColumnFiltersState<Row>,
    });

    expect(result).toEqual({
      status: { operator: 'contains', type: 'text', value: 'active' },
    });
  });

  it('returns an empty object when all filters are incompatible', () => {
    const result = sanitizeFiltersByColumns({
      columns,
      filters: {
        amount: { operator: 'equals', type: 'select', value: 'x' },
        status: { operator: 'greaterThan', type: 'number', value: 1 },
      } as ColumnFiltersState<Row>,
    });

    expect(result).toEqual({});
  });

  it('returns an empty object when filters input is empty', () => {
    const result = sanitizeFiltersByColumns({
      columns,
      filters: {} as ColumnFiltersState<Row>,
    });
    expect(result).toEqual({});
  });

  it('accepts multiSelect filter on string column', () => {
    const nameFilter: ColumnFilter = {
      type: 'multiSelect',
      values: ['Alice', 'Bob'],
    };
    const result = sanitizeFiltersByColumns({
      columns,
      filters: { name: nameFilter } as ColumnFiltersState<Row>,
    });

    expect(result).toEqual({
      name: { type: 'multiSelect', values: ['Alice', 'Bob'] },
    });
  });
});
