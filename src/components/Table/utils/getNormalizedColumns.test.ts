import { describe, expect, it } from 'vitest';

import type { TableColumn } from '@/components/Table/Table.types';

import { getNormalizedColumns } from './getNormalizedColumns.util';

type Row = { name: string; age: number; active: boolean };

const baseColumns: TableColumn<Row>[] = [
  { key: 'name', label: 'Name', dataType: 'string' },
  { key: 'age', label: 'Age', dataType: 'number' },
  { key: 'active', label: 'Active', dataType: 'boolean' },
];

describe('getNormalizedColumns', () => {
  it('returns a record keyed by column key', () => {
    const result = getNormalizedColumns({ columns: baseColumns, sorting: [] });
    expect(Object.keys(result)).toEqual(['name', 'age', 'active']);
  });

  it('preserves all column properties', () => {
    const result = getNormalizedColumns({ columns: baseColumns, sorting: [] });
    expect(result['name']?.label).toBe('Name');
    expect(result['age']?.dataType).toBe('number');
  });

  it('sets sortDirection and sortIndex to undefined when column is not sorted', () => {
    const result = getNormalizedColumns({ columns: baseColumns, sorting: [] });
    expect(result['name']?.sortDirection).toBeUndefined();
    expect(result['name']?.sortIndex).toBeUndefined();
  });

  it('attaches sortDirection and sortIndex for sorted columns', () => {
    const sorting = [
      { columnKey: 'age' as const, direction: 'desc' as const },
      { columnKey: 'name' as const, direction: 'asc' as const },
    ];
    const result = getNormalizedColumns({ columns: baseColumns, sorting });
    expect(result['age']?.sortDirection).toBe('desc');
    expect(result['age']?.sortIndex).toBe(0);
    expect(result['name']?.sortDirection).toBe('asc');
    expect(result['name']?.sortIndex).toBe(1);
    expect(result['active']?.sortDirection).toBeUndefined();
    expect(result['active']?.sortIndex).toBeUndefined();
  });

  it('returns an empty record for an empty columns array', () => {
    const result = getNormalizedColumns({ columns: [], sorting: [] });
    expect(result).toEqual({});
  });
});
