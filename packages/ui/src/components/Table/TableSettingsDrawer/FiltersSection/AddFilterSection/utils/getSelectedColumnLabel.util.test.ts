import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vite-plus/test';

import { getSelectedColumnLabel } from './getSelectedColumnLabel.util';

type Row = Record<string, unknown>;

const filterableColumns: TableColumn<Row>[] = [
  { dataType: 'string', key: 'name', label: 'Name' },
  { dataType: 'number', key: 'age', label: 'Age' },
];

describe('getSelectedColumnLabel (FiltersSection)', () => {
  it('returns empty array when selectedColumn is empty string', () => {
    expect(
      getSelectedColumnLabel({
        filterableColumns,
        filters: {},
        selectedColumn: '',
      }),
    ).toEqual([]);
  });

  it('returns empty array when column not found', () => {
    expect(
      getSelectedColumnLabel({
        filterableColumns,
        filters: {},
        selectedColumn: 'missing',
      }),
    ).toEqual([]);
  });

  it('returns label when column found and no active filter', () => {
    expect(
      getSelectedColumnLabel({
        filterableColumns,
        filters: {},
        selectedColumn: 'name',
      }),
    ).toEqual(['Name']);
  });

  it('returns label with warning when column has active filter', () => {
    const filters = {
      name: { operator: 'contains', type: 'text', value: 'x' } as const,
    };
    expect(
      getSelectedColumnLabel({
        filterableColumns,
        filters,
        selectedColumn: 'name',
      }),
    ).toEqual(['Name ⚠️ (filtered)']);
  });
});
