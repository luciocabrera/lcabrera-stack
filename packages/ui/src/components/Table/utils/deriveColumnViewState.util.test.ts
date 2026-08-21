import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnSizingState,
  TableColumn,
} from '#ui/components/Table/Table.types';

import { deriveColumnViewState } from './deriveColumnViewState.util';

type Row = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

const columns: TableColumn<Row>[] = [
  { key: 'id', label: 'ID', minWidth: 60 },
  { key: 'name', label: 'Name', minWidth: 120 },
  { key: 'age', label: 'Age', minWidth: 80 },
];

const columnSizing = {
  actions: 0,
  age: 80,
  id: 100,
  name: 140,
} as ColumnSizingState<Row>;

describe('deriveColumnViewState', () => {
  it('returns normalized columns plus pinned derived slices in one result', () => {
    const result = deriveColumnViewState<Row>({
      aggregates: [],
      columnOrder: ['id', 'name', 'age'],
      columnPinning: { left: ['id'], right: ['age'] },
      columns,
      columnSizing,
      groupingKeys: [],
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    });

    expect(result.normalizedColumns.name?.sortDirection).toBe('asc');
    expect(result.normalizedColumns.name?.sortIndex).toBe(0);
    expect(result.effectiveColumns.map(({ key }) => key)).toEqual([
      'id',
      'name',
      'age',
    ]);
    expect(
      result.pinnedColumnPartition.leftPinnedCols.map(({ key }) => key),
    ).toEqual(['id']);
    expect(
      result.pinnedColumnPartition.centerCols.map(({ key }) => key),
    ).toEqual(['name']);
    expect(
      result.pinnedColumnPartition.rightPinnedCols.map(({ key }) => key),
    ).toEqual(['age']);
    expect(result.pinnedColumnOffsets.id?.offset).toBe(0);
    expect(result.pinnedColumnOffsets.age?.side).toBe('right');
  });

  it('applies hidden-column filtering before grouping', () => {
    const result = deriveColumnViewState<Row>({
      aggregates: [],
      columnOrder: ['id', 'name', 'age'],
      columnPinning: { left: ['id'], right: ['age'] },
      columns,
      columnSizing,
      columnVisibility: new Set(['name']),
      groupingKeys: [],
      sorting: [],
    });

    expect(result.effectiveColumns.map(({ key }) => key)).toEqual([
      'id',
      'age',
    ]);
    expect(result.pinnedColumnPartition.centerCols).toEqual([]);
    expect(result.normalizedColumns.name?.label).toBe('Name');
  });
});
