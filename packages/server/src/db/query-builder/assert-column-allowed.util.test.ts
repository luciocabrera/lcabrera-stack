import { describe, expect, it } from 'vite-plus/test';

import { PersistenceError } from '../../errors/persistence.error.ts';
import { QueryRefusedError } from '../../errors/query-refused.error.ts';
import { assertColumnAllowed } from './assert-column-allowed.util.ts';

const refusePasswordHash = () =>
  assertColumnAllowed({
    allowedColumns: ['total_amount'],
    column: 'password_hash',
  });

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
    ).toThrow(
      'Column "password_hash" is not in the allowed list for this query.',
    );
  });

  it('refuses with a QueryRefusedError naming the reason and the column, not a PersistenceError', () => {
    expect(refusePasswordHash).toThrow(QueryRefusedError);
    expect(refusePasswordHash).not.toThrow(PersistenceError);
    expect(refusePasswordHash).toThrow(
      expect.objectContaining({
        column: 'password_hash',
        reason: 'column-not-allowed',
      }),
    );
  });
});
