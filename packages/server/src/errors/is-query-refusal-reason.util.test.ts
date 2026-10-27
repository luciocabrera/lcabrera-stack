import { describe, expect, it } from 'vite-plus/test';

import type { QueryRefusalReason } from './errors.types.ts';

import { isQueryRefusalReason } from './is-query-refusal-reason.util.ts';

const QUERY_REFUSAL_REASONS = [
  'column-not-allowed',
  'keyset-cursor-mismatch',
  'keyset-sort-missing',
  'keyset-sort-not-unique',
  'keyset-unique-value-missing',
] as const satisfies readonly QueryRefusalReason[];

describe('isQueryRefusalReason', () => {
  it.each(QUERY_REFUSAL_REASONS)('admits %s', (reason) => {
    expect(isQueryRefusalReason(reason)).toBe(true);
  });

  it('refuses a grouping reason, an unknown token and a non-string', () => {
    expect(isQueryRefusalReason('unknown-column')).toBe(false);
    expect(isQueryRefusalReason('toString')).toBe(false);
    expect(isQueryRefusalReason(undefined)).toBe(false);
  });
});
