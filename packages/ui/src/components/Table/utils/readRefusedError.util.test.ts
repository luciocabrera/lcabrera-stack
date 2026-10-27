import { describe, expect, it } from 'vite-plus/test';

import { readRefusedError } from './readRefusedError.util';

describe('readRefusedError', () => {
  it('reads a grouping-refused payload with its column and bound', () => {
    const error = {
      column: 'total_amount',
      estimatedRows: 73_600,
      kind: 'grouping-refused',
      message: 'This grouping was refused.',
      reason: 'estimate-too-large',
    } as const;

    expect(readRefusedError(error)).toStrictEqual(error);
  });

  it('reads a grouping-refused payload that names no column', () => {
    const error = {
      kind: 'grouping-refused',
      message:
        'The request named a column this grouped read does not take where it was named: a group key or an aggregated column must be one the read allows, and a granularity must be for one of the group keys.',
      reason: 'unknown-column',
    } as const;

    expect(readRefusedError(error)).toStrictEqual(error);
  });

  it('reads a query-refused payload and drops fields outside the member', () => {
    expect(
      readRefusedError({
        column: 'hidden',
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

  it.each([
    { kind: 'grouping-refused', reason: 'not-a-dimension' },
    { kind: 'grouping-refused', reason: 'column-not-allowed' },
    { kind: 'query-refused', reason: 'unknown-column' },
  ])(
    'returns undefined for $kind with a reason outside its vocabulary ($reason)',
    ({ kind, reason }) => {
      expect(
        readRefusedError({ kind, message: 'Refused.', reason }),
      ).toBeUndefined();
    },
  );

  it('returns undefined for another kind, a missing message or a non-object', () => {
    expect(
      readRefusedError({ kind: 'db-failed', message: 'timeout' }),
    ).toBeUndefined();
    expect(
      readRefusedError({ kind: 'query-refused', reason: 'column-not-allowed' }),
    ).toBeUndefined();
    expect(readRefusedError('query-refused')).toBeUndefined();
    expect(readRefusedError(undefined)).toBeUndefined();
  });
});
