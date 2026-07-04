import { describe, expect, it } from 'vitest';

import type { TableColumn } from '@repo/ui/components/Table/Table.types';

import { getSelectedColumnLabel } from './getSelectedColumnLabel.util';

type Row = Record<string, unknown>;

const sortableColumns: TableColumn<Row>[] = [
  { dataType: 'string', key: 'name', label: 'Name' },
  { dataType: 'number', key: 'age', label: 'Age' },
];

describe('getSelectedColumnLabel (SortingSection)', () => {
  it('returns empty array when selectedColumn is empty string', () => {
    expect(
      getSelectedColumnLabel({ selectedColumn: '', sortableColumns }),
    ).toEqual([]);
  });

  it('returns empty array when column not found', () => {
    expect(
      getSelectedColumnLabel({ selectedColumn: 'missing', sortableColumns }),
    ).toEqual([]);
  });

  it('returns label when column found', () => {
    expect(
      getSelectedColumnLabel({ selectedColumn: 'name', sortableColumns }),
    ).toEqual(['Name']);
  });
});
