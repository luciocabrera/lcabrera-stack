import { describe, expect, it } from 'vite-plus/test';

import { readTableCellParams } from './readTableCellParams.util';

const allowed = new Set(['monospace']);

describe('readTableCellParams', () => {
  it('answers the record when every key is allowed', () => {
    expect(
      readTableCellParams({ allowed, value: { monospace: true } }),
    ).toEqual({ record: { monospace: true } });
  });

  it('refuses params that are not an object', () => {
    expect(readTableCellParams({ allowed, value: [] })).toEqual({
      issues: [{ message: 'params must be an object' }],
    });
  });

  it('names the first unknown key', () => {
    expect(readTableCellParams({ allowed, value: { mono: true } })).toEqual({
      issues: [{ message: 'unknown param "mono"' }],
    });
  });
});
