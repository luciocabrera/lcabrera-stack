import { describe, expect, it } from 'vite-plus/test';

import { GroupingRefusedError } from './grouping-refused.error.ts';
import { PersistenceError } from './persistence.error.ts';

describe('GroupingRefusedError', () => {
  it('carries the reason and the column a refusal is about', () => {
    const error = new GroupingRefusedError({
      column: 'city',
      estimatedRows: 120_000,
      message: 'too large',
      reason: 'estimate-too-large',
    });

    expect(error.reason).toBe('estimate-too-large');
    expect(error.column).toBe('city');
    expect(error.estimatedRows).toBe(120_000);
    expect(error.name).toBe('GroupingRefusedError');
  });

  it('is not a PersistenceError', () => {
    // Nothing here came from the driver. Widening `PersistenceError` to cover a
    // refusal raised before a connection is even borrowed would stop it meaning
    // "the database rejected this" (ADR-050).
    const error = new GroupingRefusedError({
      message: 'no keys',
      reason: 'no-keys',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(PersistenceError);
  });

  it('leaves the optional fields undefined when a refusal names none', () => {
    const error = new GroupingRefusedError({
      message: 'too deep',
      reason: 'too-many-keys',
    });

    expect(error.column).toBeUndefined();
    expect(error.estimatedRows).toBeUndefined();
  });
});
