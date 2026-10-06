import { describe, expect, it } from 'vite-plus/test';

import { isTableCellToneName } from './isTableCellToneName.util';

describe('isTableCellToneName', () => {
  it('accepts a non-empty name', () => {
    expect(isTableCellToneName('caution')).toBe(true);
  });

  it.each([[''], ['  '], [3], [undefined]])('rejects %j', (value) => {
    expect(isTableCellToneName(value)).toBe(false);
  });
});
