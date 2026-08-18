import { describe, expect, it } from 'vite-plus/test';

import type { QueryFilter } from './query-builder.types.ts';

import { isUnaryFilter } from './is-unary-filter.util.ts';

/**
 * The predicate's compile-time job: after the guard, the binary arm is narrowed
 * enough that `filter.value` resolves. This function existing and type-checking
 * is the assertion — the runtime cases below only confirm it agrees at runtime.
 */
const readValue = (filter: QueryFilter) =>
  isUnaryFilter(filter) ? undefined : filter.value;

describe('isUnaryFilter', () => {
  it.each(['isNotNull', 'isNull'] as const)('accepts %s', (operator) => {
    expect(isUnaryFilter({ column: 'city', operator })).toBe(true);
  });

  it.each(['eq', 'gt', 'gte', 'ilike', 'in', 'lt', 'lte', 'neq'] as const)(
    'refuses the value-carrying operator %s',
    (operator) => {
      expect(isUnaryFilter({ column: 'city', operator, value: 1 })).toBe(false);
    },
  );

  it('narrows the binary arm in the negative branch', () => {
    expect(readValue({ column: 'city', operator: 'eq', value: 'Paris' })).toBe(
      'Paris',
    );
    expect(readValue({ column: 'city', operator: 'isNull' })).toBeUndefined();
  });
});
