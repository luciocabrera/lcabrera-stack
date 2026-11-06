import { describe, expect, it } from 'vite-plus/test';

import { resolveFooterAriaRowIndex } from './resolveFooterAriaRowIndex.util';
import {
  resolveAriaRowCount,
  resolveBodyAriaRowIndex,
} from './resolveGridRowIndexing.util';

describe('resolveFooterAriaRowIndex', () => {
  it('numbers the footer after the last body row', () => {
    expect(resolveFooterAriaRowIndex({ totalRows: 3 })).toBe(5);
    expect(resolveFooterAriaRowIndex({ totalRows: 3 })).toBe(
      resolveBodyAriaRowIndex({ rowIndex: 2 }) + 1,
    );
  });

  it('ends on the count a grid with a footer advertises', () => {
    expect(resolveFooterAriaRowIndex({ totalRows: 3 })).toBe(
      resolveAriaRowCount({ hasFooter: true, isLoading: false, totalRows: 3 }),
    );
  });
});
