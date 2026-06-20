import { describe, expect, it } from 'vitest';

import { getNewSortingBasedOnColumnKey } from './getNewSortingBasedOnColumnKey.util';

type Row = { age: number; id: string; name: string };

describe('getNewSortingBasedOnColumnKey', () => {
  it('adds a new sort entry when column has no existing sort', () => {
    const result = getNewSortingBasedOnColumnKey<Row>({
      columnKey: 'name',
      existingSorting: [],
      sorting: 'asc',
    });

    expect(result).toStrictEqual([{ columnKey: 'name', direction: 'asc' }]);
  });

  it('updates sort direction in-place when column already has a sort entry', () => {
    const result = getNewSortingBasedOnColumnKey<Row>({
      columnKey: 'name',
      existingSorting: [
        { columnKey: 'id', direction: 'asc' },
        { columnKey: 'name', direction: 'asc' },
      ],
      sorting: 'desc',
    });

    expect(result).toStrictEqual([
      { columnKey: 'id', direction: 'asc' },
      { columnKey: 'name', direction: 'desc' },
    ]);
  });

  it('preserves order of other columns when updating in-place', () => {
    const result = getNewSortingBasedOnColumnKey<Row>({
      columnKey: 'id',
      existingSorting: [
        { columnKey: 'id', direction: 'asc' },
        { columnKey: 'name', direction: 'asc' },
      ],
      sorting: 'desc',
    });

    expect(result[0]).toStrictEqual({ columnKey: 'id', direction: 'desc' });
    expect(result[1]).toStrictEqual({ columnKey: 'name', direction: 'asc' });
  });

  it('removes the sort entry when sorting is undefined', () => {
    const result = getNewSortingBasedOnColumnKey<Row>({
      columnKey: 'name',
      existingSorting: [
        { columnKey: 'id', direction: 'asc' },
        { columnKey: 'name', direction: 'desc' },
      ],
      sorting: undefined,
    });

    expect(result).toStrictEqual([{ columnKey: 'id', direction: 'asc' }]);
  });

  it('is a no-op remove when column has no existing sort and sorting is undefined', () => {
    const result = getNewSortingBasedOnColumnKey<Row>({
      columnKey: 'age',
      existingSorting: [{ columnKey: 'name', direction: 'asc' }],
      sorting: undefined,
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
