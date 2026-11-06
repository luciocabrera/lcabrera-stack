import { describe, expect, it } from 'vite-plus/test';

import { getCellKey } from './getCellKey.util';

describe('getCellKey', () => {
  it('joins the row and the column', () => {
    expect(getCellKey({ column: 'c', row: 'r' })).toBe('r/c');
  });

  it('keeps two different pairs apart when a key holds the separator', () => {
    expect(getCellKey({ column: 'c', row: 'a/b' })).not.toBe(
      getCellKey({ column: 'b/c', row: 'a' }),
    );
  });
});
