import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vite-plus/test';

import { getNormalizedColumns } from './getNormalizedColumns.util';

type Row = { active: boolean; age: number; name: string };

const baseColumns: TableColumn<Row>[] = [
  { dataType: 'string', key: 'name', label: 'Name' },
  { dataType: 'number', key: 'age', label: 'Age' },
  { dataType: 'boolean', key: 'active', label: 'Active' },
];

describe('getNormalizedColumns', () => {
  it('returns a record keyed by column key', () => {
    const result = getNormalizedColumns({ columns: baseColumns, sorting: [] });
    expect(Object.keys(result)).toEqual(['name', 'age', 'active']);
  });

  it('preserves all column properties', () => {
    const result = getNormalizedColumns({ columns: baseColumns, sorting: [] });
    expect(result.name?.label).toBe('Name');
    expect(result.age?.dataType).toBe('number');
  });

  it('sets sortDirection and sortIndex to undefined when column is not sorted', () => {
    const result = getNormalizedColumns({ columns: baseColumns, sorting: [] });
    expect(result.name?.sortDirection).toBeUndefined();
    expect(result.name?.sortIndex).toBeUndefined();
  });

  it('attaches sortDirection and sortIndex for sorted columns', () => {
    const sorting = [
      { columnKey: 'age' as const, direction: 'desc' as const },
      { columnKey: 'name' as const, direction: 'asc' as const },
    ];
    const result = getNormalizedColumns({ columns: baseColumns, sorting });
    expect(result.age?.sortDirection).toBe('desc');
    expect(result.age?.sortIndex).toBe(0);
    expect(result.name?.sortDirection).toBe('asc');
    expect(result.name?.sortIndex).toBe(1);
    expect(result.active?.sortDirection).toBeUndefined();
    expect(result.active?.sortIndex).toBeUndefined();
  });

  it('returns an empty record for an empty columns array', () => {
    const result = getNormalizedColumns({ columns: [], sorting: [] });
    expect(result).toEqual({});
  });
});
