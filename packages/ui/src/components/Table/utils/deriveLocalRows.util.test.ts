import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnFiltersState,
  SortingState,
} from '#ui/components/Table/Table.types';

import { deriveLocalRows } from './deriveLocalRows.util';

type Row = { readonly name: string; readonly score: number };

const rows: readonly Row[] = [
  { name: 'Gamma', score: 3 },
  { name: 'Alpha', score: 1 },
  { name: 'Beta', score: 2 },
];

const NO_FILTERS = {} as ColumnFiltersState<Row>;

const namesOf = (derived: readonly Row[]) => derived.map((row) => row.name);

describe('deriveLocalRows', () => {
  it('keeps the given order when nothing is sorted or filtered', () => {
    expect(
      namesOf(
        deriveLocalRows({ columnFilters: NO_FILTERS, rows, sorting: [] }),
      ),
    ).toStrictEqual(['Gamma', 'Alpha', 'Beta']);
  });

  it('returns a new array every time, never the rows it was given', () => {
    expect(
      deriveLocalRows({ columnFilters: NO_FILTERS, rows, sorting: [] }),
    ).not.toBe(rows);
  });

  it('sorts the rows by the sorting state', () => {
    const sorting: SortingState<Row> = [
      { columnKey: 'score', direction: 'desc' },
    ];

    expect(
      namesOf(deriveLocalRows({ columnFilters: NO_FILTERS, rows, sorting })),
    ).toStrictEqual(['Gamma', 'Beta', 'Alpha']);
  });

  it('keeps only the rows every filter matches, then sorts them', () => {
    const columnFilters = {
      score: { operator: 'greaterThan', type: 'number', value: 1 },
    } as ColumnFiltersState<Row>;
    const sorting: SortingState<Row> = [
      { columnKey: 'name', direction: 'asc' },
    ];

    expect(
      namesOf(deriveLocalRows({ columnFilters, rows, sorting })),
    ).toStrictEqual(['Beta', 'Gamma']);
  });

  it('leaves the rows it was given untouched', () => {
    deriveLocalRows({
      columnFilters: NO_FILTERS,
      rows,
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    });

    expect(namesOf(rows)).toStrictEqual(['Gamma', 'Alpha', 'Beta']);
  });

  describe('orders blank and missing cells as Postgres does', () => {
    const JSON_NULL: unknown = JSON.parse('null');
    const cells: readonly Record<string, unknown>[] = [
      { value: 'b' },
      { value: JSON_NULL },
      { value: '' },
      { value: 'a' },
      { value: undefined },
    ];
    const order = (direction: 'asc' | 'desc') =>
      deriveLocalRows({
        columnFilters: {},
        rows: cells,
        sorting: [{ columnKey: 'value', direction }],
      }).map((row) => row.value);

    it('puts the empty string first and nulls last when ascending', () => {
      expect(order('asc')).toStrictEqual(['', 'a', 'b', JSON_NULL, undefined]);
    });

    it('puts nulls first when descending', () => {
      expect(order('desc')).toStrictEqual([JSON_NULL, undefined, 'b', 'a', '']);
    });
  });
});
