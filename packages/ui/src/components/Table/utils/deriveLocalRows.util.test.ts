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
});
