import { describe, expect, it, vi } from 'vitest';

import { renderTableBodyColumnGroup } from './renderTableBodyColumnGroup.util.ts';

describe('renderTableBodyColumnGroup', () => {
  it('maps each column in order using shared row data', () => {
    const rowData = { amount: 10, name: 'A' };
    const renderCell = vi.fn(
      ({ col }: { readonly col: string }) => `cell:${col}`,
    );

    const result = renderTableBodyColumnGroup({
      columns: ['name', 'amount'],
      renderCell,
      rowData,
    });

    expect(result).toEqual(['cell:name', 'cell:amount']);
    expect(renderCell).toHaveBeenNthCalledWith(1, { col: 'name', rowData });
    expect(renderCell).toHaveBeenNthCalledWith(2, { col: 'amount', rowData });
  });

  it('returns an empty array for an empty column group', () => {
    const result = renderTableBodyColumnGroup({
      columns: [],
      renderCell: vi.fn(),
      rowData: {},
    });

    expect(result).toEqual([]);
  });

  it('passes through object columns unchanged to the callback', () => {
    const rowData = { id: 1 };
    const columns = [{ key: 'id' }, { key: 'name' }] as const;
    const renderCell = vi.fn(
      ({ col }: { readonly col: (typeof columns)[number] }) => col.key,
    );

    const result = renderTableBodyColumnGroup({
      columns,
      renderCell,
      rowData,
    });

    expect(result).toEqual(['id', 'name']);
    expect(renderCell).toHaveBeenCalledWith({ col: columns[0], rowData });
    expect(renderCell).toHaveBeenCalledWith({ col: columns[1], rowData });
  });
});
