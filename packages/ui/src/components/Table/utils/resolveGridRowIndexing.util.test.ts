import { describe, expect, it } from 'vite-plus/test';

import {
  HEADER_ARIA_ROW_INDEX,
  resolveAriaRowCount,
  resolveBodyAriaRowIndex,
} from './resolveGridRowIndexing.util';

describe('resolveGridRowIndexing', () => {
  it('counts the dataset plus its header row', () => {
    expect(resolveAriaRowCount({ totalRows: 120 })).toBe(121);
    expect(resolveAriaRowCount({ totalRows: 1 })).toBe(2);
  });

  it('reports an unknown total rather than a grid holding only its header', () => {
    // `totalRows` sits at its `0` default when the consumer supplied none;
    // `1` would assert a header and no data, which is a different claim.
    expect(resolveAriaRowCount({ totalRows: 0 })).toBe(-1);
  });

  it('numbers body rows from 2, the header having taken 1', () => {
    expect(HEADER_ARIA_ROW_INDEX).toBe(1);
    expect(resolveBodyAriaRowIndex({ rowIndex: 0 })).toBe(2);
    expect(resolveBodyAriaRowIndex({ rowIndex: 41 })).toBe(43);
  });

  it('ends the sequence exactly on the count it advertises', () => {
    // The invariant that ties the two rules together: the largest index the
    // grid can emit equals the count. Either rule read alone looks arbitrary,
    // and a change to one of them shows up only here.
    for (const totalRows of [1, 2, 50, 199, 10_000]) {
      expect(resolveBodyAriaRowIndex({ rowIndex: totalRows - 1 })).toBe(
        resolveAriaRowCount({ totalRows }),
      );
    }
  });
});
