import { describe, expect, it, vi } from 'vite-plus/test';

import { renderTableBodyPinnedGroup } from './renderTableBodyPinnedGroup.util';

const ROW_INDEX = 7;
const ROW_KEY = 'pk:[7]';

/**
 * These assertions name the **whole** forwarded payload on purpose. This
 * function drops any per-row field its signature does not destructure — excess
 * properties survive the caller's spread — so `drillRow` went missing here and
 * every drill chrome row was read as a data row (#887). An exact-shape
 * assertion is what turns that from a silent omission into a failing test.
 */
describe('renderTableBodyPinnedGroup', () => {
  it('maps each column in order using shared row data', () => {
    const row = { amount: 10, name: 'A' };
    const renderCell = vi.fn(
      ({ col }: { readonly col: string }) => `cell:${col}`,
    );

    const result = renderTableBodyPinnedGroup({
      carriedGroupKeys: new Set<string>(),
      columns: ['name', 'amount'],
      hasStructuralMarker: false,
      renderCell,
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });

    expect(result).toEqual(['cell:name', 'cell:amount']);
    expect(renderCell).toHaveBeenNthCalledWith(1, {
      carriedGroupKeys: new Set<string>(),
      col: 'name',
      disclosure: undefined,
      drillRow: undefined,
      groupSummary: undefined,
      hasStructuralMarker: false,
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });
    expect(renderCell).toHaveBeenNthCalledWith(2, {
      carriedGroupKeys: new Set<string>(),
      col: 'amount',
      disclosure: undefined,
      drillRow: undefined,
      groupSummary: undefined,
      hasStructuralMarker: false,
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });
  });

  it('returns an empty array for an empty column group', () => {
    const result = renderTableBodyPinnedGroup({
      carriedGroupKeys: new Set<string>(),
      columns: [],
      hasStructuralMarker: false,
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
      carriedGroupKeys: new Set<string>(),
      columns,
      hasStructuralMarker: false,
      renderCell,
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });

    expect(result).toEqual(['id', 'name']);
    expect(renderCell).toHaveBeenCalledWith({
      carriedGroupKeys: new Set<string>(),
      col: columns[0],
      disclosure: undefined,
      drillRow: undefined,
      groupSummary: undefined,
      hasStructuralMarker: false,
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });
    expect(renderCell).toHaveBeenCalledWith({
      carriedGroupKeys: new Set<string>(),
      col: columns[1],
      disclosure: undefined,
      drillRow: undefined,
      groupSummary: undefined,
      hasStructuralMarker: false,
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });
  });
});
