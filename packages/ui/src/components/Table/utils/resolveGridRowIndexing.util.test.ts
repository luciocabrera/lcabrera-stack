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
    // A filter that matches nothing is an ordinary outcome and the count is
    // known: one row. Answering -1 here would tell a screen-reader user the
    // size is unknowable at the moment it is most definitely known.
    expect(resolveAriaRowCount({ isLoading: false, totalRows: 0 })).toBe(1);
  });

  it('reports an unknown total only while the data has not resolved', () => {
    expect(resolveAriaRowCount({ isLoading: true, totalRows: 0 })).toBe(-1);
  });

  it('does not call a total unknown just because it is zero', () => {
    // The discriminating pair: same `totalRows`, different answers, and the
    // difference is whether the response has come back — not the count.
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
    // The invariant that ties the two rules together: the largest index the
    // grid can emit equals the count. Either rule read alone looks arbitrary,
    // and a change to one of them shows up only here.
    for (const totalRows of [1, 2, 50, 199, 10_000]) {
      expect(resolveBodyAriaRowIndex({ rowIndex: totalRows - 1 })).toBe(
        resolveAriaRowCount({ isLoading: false, totalRows }),
      );
    }
  });
});
