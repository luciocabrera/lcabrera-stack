import { describe, expect, it } from 'vite-plus/test';

import { assertColumnAllowed } from './assert-column-allowed.util.ts';

describe('assertColumnAllowed', () => {
  it('does not throw when allowedColumns is omitted', () => {
    expect(() => assertColumnAllowed({ column: 'anything' })).not.toThrow();
  });

  it('does not throw when the column is a member of allowedColumns', () => {
    expect(() =>
      assertColumnAllowed({
        allowedColumns: ['total_amount'],
        column: 'total_amount',
      }),
    ).not.toThrow();
  });

  it('throws when allowedColumns is provided and the column is not a member', () => {
    expect(() =>
      assertColumnAllowed({
        allowedColumns: ['total_amount'],
        column: 'password_hash',
      }),
    ).toThrow();
  });
});
