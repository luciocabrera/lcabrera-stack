import { describe, expect, it } from 'vite-plus/test';

import { readGroupingRefusedError } from './readGroupingRefusedError.util';

describe('readGroupingRefusedError', () => {
  it('reads a grouping-refused payload', () => {
    const error = {
      column: 'total_amount',
      estimatedRows: 73_600,
      kind: 'grouping-refused',
      message: 'This grouping was refused.',
      reason: 'estimate-too-large',
    } as const;

    expect(readGroupingRefusedError(error)).toEqual(error);
  });

  it('returns undefined when the reason is outside the vocabulary', () => {
    expect(
      readGroupingRefusedError({
        kind: 'grouping-refused',
        message: 'Refused.',
        reason: 'not-a-dimension',
      }),
    ).toBeUndefined();
  });

  it('returns undefined for a different error kind', () => {
    expect(
      readGroupingRefusedError({
        kind: 'db-failed',
        message: 'timeout',
      }),
    ).toBeUndefined();
  });
});
