import { describe, expect, it } from 'vite-plus/test';

import { readQueryRefusedError } from './readQueryRefusedError.util';

describe('readQueryRefusedError', () => {
  it('reads a query refusal with a known reason', () => {
    expect(
      readQueryRefusedError({
        kind: 'query-refused',
        message: 'The request named a column this query does not allow.',
        reason: 'column-not-allowed',
      }),
    ).toStrictEqual({
      kind: 'query-refused',
      message: 'The request named a column this query does not allow.',
      reason: 'column-not-allowed',
    });
  });

  it('drops fields outside the member', () => {
    expect(
      readQueryRefusedError({
        column: 'hidden',
        kind: 'query-refused',
        message: 'refused',
        reason: 'keyset-sort-missing',
      }),
    ).toStrictEqual({
      kind: 'query-refused',
      message: 'refused',
      reason: 'keyset-sort-missing',
    });
  });

  it('returns undefined for an unknown reason', () => {
    expect(
      readQueryRefusedError({
        kind: 'query-refused',
        message: 'refused',
        reason: 'unknown-column',
      }),
    ).toBeUndefined();
  });

  it('returns undefined for another kind, a missing message or a non-object', () => {
    expect(
      readQueryRefusedError({ kind: 'unexpected', message: 'x' }),
    ).toBeUndefined();
    expect(
      readQueryRefusedError({
        kind: 'query-refused',
        reason: 'column-not-allowed',
      }),
    ).toBeUndefined();
    expect(readQueryRefusedError('query-refused')).toBeUndefined();
    expect(readQueryRefusedError(undefined)).toBeUndefined();
  });
});
