import { describe, expect, it, vi } from 'vite-plus/test';

import { renderTableBodyPinnedGroup } from './renderTableBodyPinnedGroup.util';

const ROW_INDEX = 7;
const ROW_KEY = 'pk:[7]';

describe('renderTableBodyPinnedGroup', () => {
  it('maps each column in order using shared row data', () => {
    const row = { amount: 10, name: 'A' };
    const renderCell = vi.fn(
      ({ col }: { readonly col: string }) => `cell:${col}`,
    );

    const result = renderTableBodyPinnedGroup({
      columns: ['name', 'amount'],
      renderCell,
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });

    expect(result).toEqual(['cell:name', 'cell:amount']);
    expect(renderCell).toHaveBeenNthCalledWith(1, {
      col: 'name',
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });
    expect(renderCell).toHaveBeenNthCalledWith(2, {
      col: 'amount',
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });
  });

  it('returns an empty array for an empty column group', () => {
    const result = renderTableBodyPinnedGroup({
      columns: [],
      renderCell: vi.fn(),
      row: {},
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });

    expect(result).toEqual([]);
  });

  it('passes through object columns unchanged to the callback', () => {
    const row = { id: 1 };
    const columns = [{ key: 'id' }, { key: 'name' }] as const;
    const renderCell = vi.fn(
      ({ col }: { readonly col: (typeof columns)[number] }) => col.key,
    );

    const result = renderTableBodyPinnedGroup({
      columns,
      renderCell,
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });

    expect(result).toEqual(['id', 'name']);
    expect(renderCell).toHaveBeenCalledWith({
      col: columns[0],
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });
    expect(renderCell).toHaveBeenCalledWith({
      col: columns[1],
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });
  });
});
