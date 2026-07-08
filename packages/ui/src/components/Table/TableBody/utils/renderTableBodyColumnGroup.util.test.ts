import { describe, expect, it, vi } from 'vitest';

import { renderTableBodyColumnGroup } from './renderTableBodyColumnGroup.util';

describe('renderTableBodyColumnGroup', () => {
  it('maps each column in order using shared row data', () => {
    const row = { amount: 10, name: 'A' };
    const renderCell = vi.fn(
      ({ col }: { readonly col: string }) => `cell:${col}`,
    );

    const result = renderTableBodyColumnGroup({
      columns: ['name', 'amount'],
      renderCell,
      row,
    });

    expect(result).toEqual(['cell:name', 'cell:amount']);
    expect(renderCell).toHaveBeenNthCalledWith(1, { col: 'name', row });
    expect(renderCell).toHaveBeenNthCalledWith(2, { col: 'amount', row });
  });

  it('returns an empty array for an empty column group', () => {
    const result = renderTableBodyColumnGroup({
      columns: [],
      renderCell: vi.fn(),
      row: {},
    });

    expect(result).toEqual([]);
  });

  it('passes through object columns unchanged to the callback', () => {
    const row = { id: 1 };
    const columns = [{ key: 'id' }, { key: 'name' }] as const;
    const renderCell = vi.fn(
      ({ col }: { readonly col: (typeof columns)[number] }) => col.key,
    );

    const result = renderTableBodyColumnGroup({
      columns,
      renderCell,
      row,
    });

    expect(result).toEqual(['id', 'name']);
    expect(renderCell).toHaveBeenCalledWith({ col: columns[0], row });
    expect(renderCell).toHaveBeenCalledWith({ col: columns[1], row });
  });
});
