import { describe, expect, it } from 'vite-plus/test';

import { toTableResponseError } from './toTableResponseError.util';

describe('toTableResponseError', () => {
  it('passes through a TableResponseError', () => {
    const error = {
      code: '57014',
      kind: 'db-failed',
      message: 'statement timeout',
    } as const;

    expect(toTableResponseError({ error, fallback: 'failed' })).toEqual(error);
  });

  it('maps an AbortError to db-canceled', () => {
    expect(
      toTableResponseError({
        error: new DOMException('The user aborted a request.', 'AbortError'),
        fallback: 'failed',
      }),
    ).toEqual({
      kind: 'db-canceled',
      message: 'The user aborted a request.',
    });
  });

  it('maps an Error to db-failed', () => {
    expect(
      toTableResponseError({
        error: new Error('Network down'),
        fallback: 'failed',
      }),
    ).toEqual({
      kind: 'db-failed',
      message: 'Network down',
    });
  });

  it('maps a non-Error value to unexpected with the fallback', () => {
    expect(
      toTableResponseError({ error: 'string error', fallback: 'failed' }),
    ).toEqual({
      kind: 'unexpected',
      message: 'failed',
    });
  });

  it('passes through a grouping-refused error', () => {
    const error = {
      column: 'total_amount',
      estimatedRows: 73_600,
      kind: 'grouping-refused',
      message: 'This grouping was refused.',
      reason: 'estimate-too-large',
    } as const;

    expect(toTableResponseError({ error, fallback: 'failed' })).toEqual(error);
  });
});
