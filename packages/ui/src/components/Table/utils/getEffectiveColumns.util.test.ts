import { describe, expect, it } from 'vite-plus/test';

import type { ColumnPinningState, TableColumn } from '../Table.types';

import { getEffectiveColumns } from './getEffectiveColumns.util';

type Row = { age: number; id: string; name: string };

const columns: TableColumn<Row>[] = [
  { dataType: 'string', key: 'id', label: 'ID' },
  { dataType: 'string', key: 'name', label: 'Name' },
  { dataType: 'number', key: 'age', label: 'Age' },
];

describe('getEffectiveColumns', () => {
  it('returns all columns when no visibility/order/pinning', () => {
    const result = getEffectiveColumns({ columns });
    expect(result.map((c) => c.key)).toEqual(['id', 'name', 'age']);
  });

  it('filters out hidden columns', () => {
    const columnVisibility = new Set<'actions' | 'age' | 'id' | 'name'>([
      'name',
    ]);
    const result = getEffectiveColumns({ columns, columnVisibility });
    expect(result.map((c) => c.key)).toEqual(['id', 'age']);
  });

  it('applies column order', () => {
    const result = getEffectiveColumns({
      columnOrder: ['age', 'id', 'name'],
      columns,
    });
    expect(result.map((c) => c.key)).toEqual(['age', 'id', 'name']);
  });

  it('columns not in order are appended', () => {
    const result = getEffectiveColumns({ columnOrder: ['age'], columns });
    expect(result.map((c) => c.key)).toEqual(['age', 'id', 'name']);
  });

  it('applies pinning order: left, unpinned, right', () => {
    const columnPinning: ColumnPinningState<Row> = {
      left: ['id'],
      right: ['age'],
    };
    const result = getEffectiveColumns({ columnPinning, columns });
    expect(result.map((c) => c.key)).toEqual(['id', 'name', 'age']);
  });

  it('returns same columns when pinning has empty arrays', () => {
    const columnPinning: ColumnPinningState<Row> = { left: [], right: [] };
    const result = getEffectiveColumns({ columnPinning, columns });
    expect(result.map((c) => c.key)).toEqual(['id', 'name', 'age']);
  });
});
