import { describe, expect, it, vi } from 'vite-plus/test';

import { renderTableBodyPinnedGroup } from './renderTableBodyPinnedGroup.util';

const ROW_INDEX = 7;
const ROW_KEY = 'pk:[7]';

/**
 * This function drops any per-row field its signature does not destructure —
 * excess properties survive the caller's spread — so the structural marker went
 * missing here and every structural row was read as a data row (#887).
 *
 * **A field is only pinned by a case that actually passes one.** These
 * assertions name the whole payload, but `toHaveBeenNthCalledWith` compares
 * with `toEqual` semantics, and those treat an absent key and an `undefined`
 * key as equal — so a case whose input leaves a field `undefined` passes
 * whether or not the field is forwarded, and could never have caught the
 * original bug. The last case below passes a real marker for exactly that
 * reason; the grid-level guard is `Table.groupedCrud.test.tsx`.
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
      groupSummary: undefined,
      hasStructuralMarker: false,
      row,
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });
  });

  it('forwards the structural marker rather than dropping it', () => {
    // The regression case. With `hasStructuralMarker` missing from this
    // function's
    // destructuring the call object has no such key, and every other case here
    // passes whether or not it does — an `undefined` expectation cannot tell
    // "not forwarded" from "forwarded as undefined".
    const renderCell = vi.fn(({ col }: { readonly col: string }) => col);

    renderTableBodyPinnedGroup({
      carriedGroupKeys: new Set<string>(),
      columns: ['name'],
      hasStructuralMarker: true,
      renderCell,
      row: {},
      rowIndex: ROW_INDEX,
      rowKey: ROW_KEY,
    });

    expect(renderCell).toHaveBeenCalledWith(
      expect.objectContaining({ hasStructuralMarker: true }),
    );
  });
});
