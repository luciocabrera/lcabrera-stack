import { describe, expect, it } from 'vite-plus/test';

import { getNewColumnFiltersBasedOnColumnKey } from './getNewColumnFiltersBasedOnColumnKey.util';

type Row = { age: number; id: string; name: string };

const textFilter = {
  operator: 'contains',
  type: 'text',
  value: 'John',
} as const;
const otherFilter = { operator: 'equals', type: 'text', value: 'Doe' } as const;

describe('getNewColumnFiltersBasedOnColumnKey', () => {
  it('adds a filter when column has no existing entry', () => {
    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnFilter: textFilter,
      columnFiltersState: {} as never,
      columnKey: 'name',
    });

    expect(result).toStrictEqual({ name: textFilter });
  });

  it('replaces an existing filter entry for the column', () => {
    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnFilter: otherFilter,
      columnFiltersState: { name: textFilter } as never,
      columnKey: 'name',
    });

    expect(result).toStrictEqual({ name: otherFilter });
  });

  it('returns the same state when the filter is unchanged', () => {
    const columnFiltersState = { name: textFilter } as never;

    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnFilter: textFilter,
      columnFiltersState,
      columnKey: 'name',
    });

    expect(result).toBe(columnFiltersState);
  });

  it('removes the filter entry when columnFilter is undefined', () => {
    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnFilter: undefined,
      columnFiltersState: { id: otherFilter, name: textFilter } as never,
      columnKey: 'name',
    });

    expect(result).not.toHaveProperty('name');
    expect(result).toHaveProperty('id');
  });

  it('preserves other column filters when removing one', () => {
    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnFilter: undefined,
      columnFiltersState: { age: otherFilter, name: textFilter } as never,
      columnKey: 'name',
    });

    expect(result).toStrictEqual({ age: otherFilter });
  });

  it('defaults columnFiltersState to empty object when not provided', () => {
    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnFilter: textFilter,
      columnKey: 'name',
    });

    expect(result).toStrictEqual({ name: textFilter });
  });

  it('returns empty object when removing the only filter and no others exist', () => {
    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnFilter: undefined,
      columnFiltersState: { name: textFilter } as never,
      columnKey: 'name',
    });

    expect(result).toStrictEqual({});
  });

  it('returns the same state when removing a missing filter key', () => {
    const columnFiltersState = { age: otherFilter } as never;

    const result = getNewColumnFiltersBasedOnColumnKey<Row>({
      columnFilter: undefined,
      columnFiltersState,
      columnKey: 'name',
    });

    expect(result).toBe(columnFiltersState);
  });
});
