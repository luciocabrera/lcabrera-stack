import { describe, expect, it } from 'vitest';

import { assertColumnAllowed } from './assertColumnAllowed.util.ts';

describe('assertColumnAllowed', () => {
  it('does not throw when allowedColumns is omitted', () => {
    expect(() => assertColumnAllowed({ column: 'anything' })).not.toThrow();
  });

  it('does not throw when the column is a member of allowedColumns', () => {
    expect(() =>
      assertColumnAllowed({
        allowedColumns: ['total_cost_usd'],
        column: 'total_cost_usd',
      }),
    ).not.toThrow();
  });

  it('throws when allowedColumns is provided and the column is not a member', () => {
    expect(() =>
      assertColumnAllowed({
        allowedColumns: ['total_cost_usd'],
        column: 'password_hash',
      }),
    ).toThrow();
  });
});
