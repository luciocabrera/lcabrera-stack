import { describe, expect, it } from 'vite-plus/test';

import { getNewColumnSizingBasedOnColumnKey } from './getNewColumnSizingBasedOnColumnKey.util';

type Row = { age: number; id: string; name: string };

describe('getNewColumnSizingBasedOnColumnKey', () => {
  it('adds a width entry when column has no existing size', () => {
    const result = getNewColumnSizingBasedOnColumnKey<Row>({
      columnKey: 'name',
      columnSizesState: {} as never,
      columnSizing: 200,
    });

    expect(result).toStrictEqual({ name: 200 });
  });

  it('replaces an existing width entry for the column', () => {
    const result = getNewColumnSizingBasedOnColumnKey<Row>({
      columnKey: 'name',
      columnSizesState: { name: 150 } as never,
      columnSizing: 300,
    });

    expect(result).toStrictEqual({ name: 300 });
  });

  it('removes the width entry when columnSizing is undefined', () => {
    const result = getNewColumnSizingBasedOnColumnKey<Row>({
      columnKey: 'name',
      columnSizesState: { id: 100, name: 200 } as never,
      columnSizing: undefined,
    });

    expect(result).not.toHaveProperty('name');
    expect(result).toHaveProperty('id', 100);
  });

  it('preserves other column sizes when removing one', () => {
    const result = getNewColumnSizingBasedOnColumnKey<Row>({
      columnKey: 'name',
      columnSizesState: { age: 120, name: 200 } as never,
      columnSizing: undefined,
    });

    expect(result).toStrictEqual({ age: 120 });
  });

  it('defaults columnSizesState to empty object when not provided', () => {
    const result = getNewColumnSizingBasedOnColumnKey<Row>({
      columnKey: 'name',
      columnSizing: 250,
    });

    expect(result).toStrictEqual({ name: 250 });
  });

  it('returns empty object when removing the only size entry', () => {
    const result = getNewColumnSizingBasedOnColumnKey<Row>({
      columnKey: 'name',
      columnSizesState: { name: 200 } as never,
      columnSizing: undefined,
    });

    expect(result).toStrictEqual({});
  });
});
