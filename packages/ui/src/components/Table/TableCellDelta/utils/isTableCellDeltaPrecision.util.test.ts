import { describe, expect, it } from 'vite-plus/test';

import { isTableCellDeltaPrecision } from './isTableCellDeltaPrecision.util';

describe('isTableCellDeltaPrecision', () => {
  it.each([[0], [1], [20]])('accepts %j', (value) => {
    expect(isTableCellDeltaPrecision(value)).toBe(true);
  });

  it.each([[-1], [21], [1.5], ['1'], [undefined]])('rejects %j', (value) => {
    expect(isTableCellDeltaPrecision(value)).toBe(false);
  });
});
