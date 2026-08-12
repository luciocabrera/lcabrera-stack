import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import { resolveFocusedRowIndex } from './resolveFocusedRowIndex.util';

type Row = Record<string, unknown>;

const columns: TableColumn<Row>[] = [
  { isPrimaryKey: true, key: 'id', label: 'Id' },
  { key: 'name', label: 'Name' },
];

const rowAt = (id: number): Row => ({ id, name: `Name ${id}` });

const data = [rowAt(10), rowAt(11), rowAt(12), rowAt(13)];

const keyOf = (row: Row) => resolveRowKey({ columns, index: 0, row });

const KEY_OF_12 = keyOf(rowAt(12));
const KEY_OF_13 = keyOf(rowAt(13));

describe('resolveFocusedRowIndex', () => {
  it('keeps the stored index when it still names the same row', () => {
    expect(
      resolveFocusedRowIndex({
        columns,
        data,
        rowIndex: 2,
        rowKey: KEY_OF_12,
      }),
    ).toBe(2);
  });

  it('finds the row again after the data around it moved', () => {
    // A sort put the same row somewhere else. Identity is data-derived, so it
    // is still the same row and focus follows it rather than the position.
    const reordered = [rowAt(13), rowAt(12), rowAt(11), rowAt(10)];

    expect(
      resolveFocusedRowIndex({
        columns,
        data: reordered,
        rowIndex: 2,
        rowKey: KEY_OF_12,
      }),
    ).toBe(1);
  });

  it('falls back to the nearest surviving row when the focused one is gone', () => {
    expect(
      resolveFocusedRowIndex({
        columns,
        data: [rowAt(10), rowAt(11)],
        rowIndex: 3,
        rowKey: KEY_OF_13,
      }),
    ).toBe(1);
  });

  it('keeps the same absolute index when the row at it was replaced', () => {
    const filtered = [rowAt(20), rowAt(21), rowAt(22), rowAt(23)];

    expect(
      resolveFocusedRowIndex({
        columns,
        data: filtered,
        rowIndex: 2,
        rowKey: KEY_OF_12,
      }),
    ).toBe(2);
  });

  it('answers undefined when there is no focus target', () => {
    expect(
      resolveFocusedRowIndex({ columns, data, rowIndex: 1, rowKey: undefined }),
    ).toBeUndefined();
  });

  it('answers undefined when no row survives at all', () => {
    expect(
      resolveFocusedRowIndex({
        columns,
        data: [],
        rowIndex: 2,
        rowKey: KEY_OF_12,
      }),
    ).toBeUndefined();
  });

  it('finds the row without a stored index to start from', () => {
    expect(
      resolveFocusedRowIndex({
        columns,
        data,
        rowIndex: undefined,
        rowKey: KEY_OF_13,
      }),
    ).toBe(3);
  });
});
