import { describe, expect, it } from 'vite-plus/test';

import {
  HEADER_ARIA_ROW_INDEX,
  resolveAriaRowCount,
  resolveBodyAriaRowIndex,
} from './resolveGridRowIndexing.util';

describe('resolveGridRowIndexing', () => {
  it('counts the dataset plus its header row', () => {
    expect(resolveAriaRowCount({ isLoading: false, totalRows: 120 })).toBe(121);
    expect(resolveAriaRowCount({ isLoading: false, totalRows: 1 })).toBe(2);
  });

  it('reports a resolved empty grid as holding exactly its header row', () => {
    expect(resolveAriaRowCount({ isLoading: false, totalRows: 0 })).toBe(1);
  });

  it('reports an unknown total only while the data has not resolved', () => {
    expect(resolveAriaRowCount({ isLoading: true, totalRows: 0 })).toBe(-1);
  });

  it('does not call a total unknown just because it is zero', () => {
    expect(resolveAriaRowCount({ isLoading: true, totalRows: 0 })).not.toBe(
      resolveAriaRowCount({ isLoading: false, totalRows: 0 }),
    );
  });

  it('numbers body rows from 2, the header having taken 1', () => {
    expect(HEADER_ARIA_ROW_INDEX).toBe(1);
    expect(resolveBodyAriaRowIndex({ rowIndex: 0 })).toBe(2);
    expect(resolveBodyAriaRowIndex({ rowIndex: 41 })).toBe(43);
  });

  it('ends the sequence exactly on the count it advertises', () => {
    for (const totalRows of [1, 2, 50, 199, 10_000]) {
      expect(resolveBodyAriaRowIndex({ rowIndex: totalRows - 1 })).toBe(
        resolveAriaRowCount({ isLoading: false, totalRows }),
      );
    }
  });
});
