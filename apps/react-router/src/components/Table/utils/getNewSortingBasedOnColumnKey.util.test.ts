import { describe, expect, it } from 'vitest';

import { getNewSortingBasedOnColumnKey } from './getNewSortingBasedOnColumnKey.util';

type Row = { id: string; name: string; age: number };

describe('getNewSortingBasedOnColumnKey', () => {
  it('adds a new sort entry when column has no existing sort', () => {
    const result = getNewSortingBasedOnColumnKey<Row>({
      columnKey: 'name',
      sorting: 'asc',
      existingSorting: [],
    });

    expect(result).toStrictEqual([{ columnKey: 'name', direction: 'asc' }]);
  });

  it('updates sort direction in-place when column already has a sort entry', () => {
    const result = getNewSortingBasedOnColumnKey<Row>({
      columnKey: 'name',
      sorting: 'desc',
      existingSorting: [
        { columnKey: 'id', direction: 'asc' },
        { columnKey: 'name', direction: 'asc' },
      ],
    });

    expect(result).toStrictEqual([
      { columnKey: 'id', direction: 'asc' },
      { columnKey: 'name', direction: 'desc' },
    ]);
  });

  it('preserves order of other columns when updating in-place', () => {
    const result = getNewSortingBasedOnColumnKey<Row>({
      columnKey: 'id',
      sorting: 'desc',
      existingSorting: [
        { columnKey: 'id', direction: 'asc' },
        { columnKey: 'name', direction: 'asc' },
      ],
    });

    expect(result[0]).toStrictEqual({ columnKey: 'id', direction: 'desc' });
    expect(result[1]).toStrictEqual({ columnKey: 'name', direction: 'asc' });
  });

  it('removes the sort entry when sorting is undefined', () => {
    const result = getNewSortingBasedOnColumnKey<Row>({
      columnKey: 'name',
      sorting: undefined,
      existingSorting: [
        { columnKey: 'id', direction: 'asc' },
        { columnKey: 'name', direction: 'desc' },
      ],
    });

    expect(result).toStrictEqual([{ columnKey: 'id', direction: 'asc' }]);
  });

  it('is a no-op remove when column has no existing sort and sorting is undefined', () => {
    const result = getNewSortingBasedOnColumnKey<Row>({
      columnKey: 'age',
      sorting: undefined,
      existingSorting: [{ columnKey: 'name', direction: 'asc' }],
    });

    expect(result).toStrictEqual([{ columnKey: 'name', direction: 'asc' }]);
  });

  it('defaults existingSorting to empty array when not provided', () => {
    const result = getNewSortingBasedOnColumnKey<Row>({
      columnKey: 'id',
      sorting: 'asc',
    });

    expect(result).toStrictEqual([{ columnKey: 'id', direction: 'asc' }]);
  });
});
