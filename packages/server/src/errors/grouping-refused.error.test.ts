import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { GroupingRefusalReason } from './errors.types.ts';

import { GroupingRefusedError } from './grouping-refused.error.ts';
import { PersistenceError } from './persistence.error.ts';
import { QueryRefusedError } from './query-refused.error.ts';

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
    const error = new GroupingRefusedError({
      message: 'no keys',
      reason: 'no-keys',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(PersistenceError);
  });

  it('is a QueryRefusedError, so one check catches every refusal', () => {
    const cause = new Error('inner');
    const error = new GroupingRefusedError({
      cause,
      column: 'city',
      message: 'unknown column',
      reason: 'unknown-column',
    });

    expect(error).toBeInstanceOf(QueryRefusedError);
    expectTypeOf(error.reason).toEqualTypeOf<GroupingRefusalReason>();
    expect(error.name).toBe('GroupingRefusedError');
    expect(error.cause).toBe(cause);
    expect(error.column).toBe('city');
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
