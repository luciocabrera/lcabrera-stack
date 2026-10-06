import { describe, expect, it } from 'vite-plus/test';

import { isTableCellParamsRecord } from './isTableCellParamsRecord.util';

describe('isTableCellParamsRecord', () => {
  it('accepts a plain object', () => {
    expect(isTableCellParamsRecord({ a: 1 })).toBe(true);
  });

  it.each([[[]], [JSON.parse('null')], ['x'], [3], [undefined]])(
    'rejects %j',
    (value) => {
      expect(isTableCellParamsRecord(value)).toBe(false);
    },
  );
});
