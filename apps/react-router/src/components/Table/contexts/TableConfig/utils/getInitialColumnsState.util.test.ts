import { describe, expect, it } from 'vitest';

import type { TableColumn } from '@/components/Table/Table.types';

import { getInitialColumnsState } from './getInitialColumnsState.util';

type Row = { id: string; name: string };

const columns: TableColumn<Row>[] = [
  { dataType: 'string', key: 'id', label: 'ID' },
  { dataType: 'string', key: 'name', label: 'Name' },
];

const persistenceKey = 'test-table';

describe('getInitialColumnsState (TableConfig)', () => {
  it('returns default values when no args provided', () => {
    const result = getInitialColumnsState({ persistenceKey });
    expect(result.columns).toEqual([]);
    expect(result.columnOrder).toEqual([]);
    expect(result.sorting).toEqual([]);
    expect(result.columnPinning).toEqual({ left: [], right: [] });
    expect(result.columnVisibility).toBeInstanceOf(Set);
    expect(result.staticKeys).toBeInstanceOf(Set);
  });

  it('computes effectiveColumns from inputs', () => {
    const result = getInitialColumnsState({ columns, persistenceKey });
    expect(result.effectiveColumns).toHaveLength(2);
  });

  it('computes normalizedColumns', () => {
    const result = getInitialColumnsState({ columns, persistenceKey });
    // normalizedColumns is a Record keyed by column key, not an array
    expect(typeof result.normalizedColumns).toBe('object');
    expect('id' in result.normalizedColumns).toBe(true);
    expect('name' in result.normalizedColumns).toBe(true);
  });

  it('identifies static keys', () => {
    const cols: TableColumn<Row>[] = [
      { dataType: 'string', isStatic: true, key: 'id', label: 'ID' },
      { dataType: 'string', key: 'name', label: 'Name' },
    ];
    const result = getInitialColumnsState({ columns: cols, persistenceKey });
    expect(result.staticKeys.has('id')).toBe(true);
    expect(result.staticKeys.has('name')).toBe(false);
  });
});
