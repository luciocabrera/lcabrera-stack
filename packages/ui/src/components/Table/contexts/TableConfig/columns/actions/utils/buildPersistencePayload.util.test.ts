import type {
  ColumnFiltersState,
  ColumnSizingState,
} from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

import { buildPersistencePayload } from './buildPersistencePayload.util';

type Row = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

const columnFilters = {
  name: {
    operator: 'contains',
    type: 'text',
    value: 'ali',
  },
} as ColumnFiltersState<Row>;

const columnSizing = {
  actions: 0,
  age: 80,
  id: 120,
  name: 160,
} as ColumnSizingState<Row>;

describe('buildPersistencePayload', () => {
  it('builds the five-slice payload for column batch updates', () => {
    const result = buildPersistencePayload<Row>({
      columnFilters,
      columnOrder: ['id', 'name', 'age'],
      columnPinning: { left: ['id'], right: [] },
      columnSizing,
      persistenceKey: 'orders-table',
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    });

    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({
      searchParamKey: 'filters',
      searchParamValue: '{"name":["ct","ali"]}',
    });
    expect(result[1]).toEqual({
      searchParamKey: 'sorting',
      searchParamValue: '{"name":"asc"}',
    });
    expect(result.map(({ slice }) => slice)).toEqual([
      undefined,
      undefined,
      'columnSizing',
      'columnPinning',
      'columnOrder',
    ]);
  });

  it('adds columnVisibility for table-wide updates and preserves empty URL states', () => {
    const hiddenColumns = new Set<'actions' | 'age' | 'id' | 'name'>(['age']);
    const result = buildPersistencePayload<Row>({
      columnFilters: {} as ColumnFiltersState<Row>,
      columnOrder: ['id', 'name', 'age'],
      columnPinning: { left: [], right: [] },
      columnSizing,
      columnVisibility: hiddenColumns,
      persistenceKey: 'orders-table',
      sorting: [],
    });

    expect(result).toHaveLength(6);
    expect(result[0]?.searchParamValue).toBeUndefined();
    expect(result[1]?.searchParamValue).toBeUndefined();
    expect(result[5]).toEqual({
      persistenceKey: 'orders-table',
      slice: 'columnVisibility',
      valueSlice: hiddenColumns,
    });
  });
});
