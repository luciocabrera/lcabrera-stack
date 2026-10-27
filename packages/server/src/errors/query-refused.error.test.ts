import { describe, expect, it } from 'vite-plus/test';

import { GroupingRefusedError } from './grouping-refused.error.ts';
import { PersistenceError } from './persistence.error.ts';
import { QueryRefusedError } from './query-refused.error.ts';

describe('QueryRefusedError', () => {
  it('carries the reason and the column a refusal is about', () => {
    const error = new QueryRefusedError({
      column: 'secret',
      message: 'Column "secret" is not in the allowed list for this query.',
      reason: 'column-not-allowed',
    });

    expect(error.reason).toBe('column-not-allowed');
    expect(error.column).toBe('secret');
    expect(error.message).toContain('secret');
    expect(error.name).toBe('QueryRefusedError');
  });

  it('is neither a PersistenceError nor a GroupingRefusedError', () => {
    const error = new QueryRefusedError({
      message: 'no sort',
      reason: 'keyset-sort-missing',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(PersistenceError);
    expect(error).not.toBeInstanceOf(GroupingRefusedError);
  });

  it('leaves the column undefined when a refusal names none', () => {
    const error = new QueryRefusedError({
      message: 'mismatch',
      reason: 'keyset-cursor-mismatch',
    });

    expect(error.column).toBeUndefined();
  });
});
