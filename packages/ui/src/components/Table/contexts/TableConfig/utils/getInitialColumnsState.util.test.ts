import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { getInitialColumnsState } from './getInitialColumnsState.util';

type Row = { id: string; name: string };

const columns: TableColumn<Row>[] = [
  { dataType: 'string', key: 'id', label: 'ID' },
  { dataType: 'string', key: 'name', label: 'Name' },
];

describe('getInitialColumnsState (TableConfig)', () => {
  it('returns default values when no args provided', () => {
    const result = getInitialColumnsState({});
    expect(result.columns).toEqual([]);
    expect(result.columnOrder).toEqual([]);
    expect(result.sorting).toEqual([]);
    expect(result.columnPinning).toEqual({ left: [], right: [] });
    expect(result.columnVisibility).toBeInstanceOf(Set);
    expect(result.staticKeys).toBeInstanceOf(Set);
  });

  it('computes effectiveColumns from inputs', () => {
    const result = getInitialColumnsState({ columns });
    expect(result.effectiveColumns).toHaveLength(2);
  });

  it('normalizes a partial columnPinning object (cookie miss) without crashing', () => {
    const result = getInitialColumnsState({
      // A `{}` pinning value can arrive when no pinning cookie is present.
      columnPinning: {} as never,
      columns,
    });
    expect(result.columnPinning).toEqual({ left: [], right: [] });
    expect(result.pinnedColumnOffsets).toEqual({});
  });

  it('computes normalizedColumns', () => {
    const result = getInitialColumnsState({ columns });
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
    const result = getInitialColumnsState({ columns: cols });
    expect(result.staticKeys.has('id')).toBe(true);
    expect(result.staticKeys.has('name')).toBe(false);
  });

  it('does not add or pin an actions column when crud is undefined', () => {
    const result = getInitialColumnsState({ columns });
    expect(result.columns.some((column) => column.key === 'actions')).toBe(
      false,
    );
    expect(result.columnPinning.right).toEqual([]);
  });

  it('does not add an actions column when only crud.create is enabled', () => {
    const result = getInitialColumnsState({
      columns,
      crud: { create: true },
    });
    expect(result.columns.some((column) => column.key === 'actions')).toBe(
      false,
    );
    expect(result.columnPinning.right).toEqual([]);
  });

  it('synthesizes and right-pins the actions column when crud.delete is enabled', () => {
    const result = getInitialColumnsState({
      columns,
      crud: { delete: true },
    });
    expect(result.columns.some((column) => column.key === 'actions')).toBe(
      true,
    );
    expect(result.columnPinning.right).toEqual(['actions']);
  });
});
