import { describe, expect, it } from 'vitest';

import { getNewColumnFiltersBasedOnColumnKey } from './getNewColumnFiltersBasedOnColumnKey.util';

type Row = { id: string; name: string; age: number };

const textFilter = {
  operator: 'contains',
  type: 'text',
  value: 'John',
} as const;
const otherFilter = { operator: 'equals', type: 'text', value: 'Doe' } as const;

describe('getNewColumnFiltersBasedOnColumnKey', () => {
  it('adds a filter when column has no existing entry', () => {
    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnKey: 'name',
      columnFilter: textFilter,
      columnFiltersState: {} as never,
    });

    expect(result).toStrictEqual({ name: textFilter });
  });

  it('replaces an existing filter entry for the column', () => {
    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnKey: 'name',
      columnFilter: otherFilter,
      columnFiltersState: { name: textFilter } as never,
    });

    expect(result).toStrictEqual({ name: otherFilter });
  });

  it('removes the filter entry when columnFilter is undefined', () => {
    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnKey: 'name',
      columnFilter: undefined,
      columnFiltersState: { name: textFilter, id: otherFilter } as never,
    });

    expect(result).not.toHaveProperty('name');
    expect(result).toHaveProperty('id');
  });

  it('preserves other column filters when removing one', () => {
    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnKey: 'name',
      columnFilter: undefined,
      columnFiltersState: { age: otherFilter, name: textFilter } as never,
    });

    expect(result).toStrictEqual({ age: otherFilter });
  });

  it('defaults columnFiltersState to empty object when not provided', () => {
    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnKey: 'name',
      columnFilter: textFilter,
    });

    expect(result).toStrictEqual({ name: textFilter });
  });

  it('returns empty object when removing the only filter and no others exist', () => {
    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnKey: 'name',
      columnFilter: undefined,
      columnFiltersState: { name: textFilter } as never,
    });

    expect(result).toStrictEqual({});
  });
});
