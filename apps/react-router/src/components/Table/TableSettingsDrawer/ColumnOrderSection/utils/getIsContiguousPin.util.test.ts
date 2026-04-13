import { describe, expect, it } from 'vitest';

import type { TableColumn } from '@/components/Table/Table.types';

import { getIsContiguousPin } from './getIsContiguousPin.util.ts';

type Row = { id: string; name: string; age: number; actions: string };

const cols: TableColumn<Row>[] = [
  { dataType: 'string', key: 'id', label: 'ID' },
  { dataType: 'string', key: 'name', label: 'Name' },
  { dataType: 'number', key: 'age', label: 'Age' },
  { dataType: 'string', key: 'actions', label: 'Actions' },
];

describe('getIsContiguousPin', () => {
  it('returns true for left pin when all preceding columns are left-pinned', () => {
    const result = getIsContiguousPin({
      allOrderedColumns: cols,
      columnKey: 'name',
      columnPinning: { left: ['id'], right: [] },
      side: 'left',
    });
    expect(result).toBe(true);
  });

  it('returns false for left pin when a preceding column is not left-pinned', () => {
    const result = getIsContiguousPin({
      allOrderedColumns: cols,
      columnKey: 'age',
      columnPinning: { left: ['id'], right: [] },
      side: 'left',
    });
    expect(result).toBe(false);
  });

  it('returns true for right pin when all following columns are right-pinned', () => {
    const result = getIsContiguousPin({
      allOrderedColumns: cols,
      columnKey: 'age',
      columnPinning: { left: [], right: ['actions'] },
      side: 'right',
    });
    expect(result).toBe(true);
  });

  it('returns false for right pin when a following column is not right-pinned', () => {
    const result = getIsContiguousPin({
      allOrderedColumns: cols,
      columnKey: 'name',
      columnPinning: { left: [], right: ['actions'] },
      side: 'right',
    });
    expect(result).toBe(false);
  });

  it('returns true for first column pinned left', () => {
    const result = getIsContiguousPin({
      allOrderedColumns: cols,
      columnKey: 'id',
      columnPinning: { left: [], right: [] },
      side: 'left',
    });
    expect(result).toBe(true);
  });

  it('returns true for last column pinned right', () => {
    const result = getIsContiguousPin({
      allOrderedColumns: cols,
      columnKey: 'actions',
      columnPinning: { left: [], right: [] },
      side: 'right',
    });
    expect(result).toBe(true);
  });
});
