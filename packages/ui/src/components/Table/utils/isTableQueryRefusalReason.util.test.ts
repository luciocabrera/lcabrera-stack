import { describe, expect, it } from 'vite-plus/test';

import type { TableQueryRefusalReason } from '../Table.types';

import { isTableQueryRefusalReason } from './isTableQueryRefusalReason.util';

const TABLE_QUERY_REFUSAL_REASONS = [
  'column-not-allowed',
  'keyset-cursor-mismatch',
  'keyset-sort-missing',
  'keyset-sort-not-unique',
  'keyset-unique-value-missing',
] as const satisfies readonly TableQueryRefusalReason[];

describe('isTableQueryRefusalReason', () => {
  it.each(TABLE_QUERY_REFUSAL_REASONS)('admits %s', (reason) => {
    expect(isTableQueryRefusalReason(reason)).toBe(true);
  });

  it('refuses a token outside the vocabulary', () => {
    expect(isTableQueryRefusalReason('unknown-column')).toBe(false);
    expect(isTableQueryRefusalReason('')).toBe(false);
  });

  it('refuses a non-string', () => {
    expect(isTableQueryRefusalReason(undefined)).toBe(false);
    expect(isTableQueryRefusalReason(1)).toBe(false);
  });

  it('does not admit an inherited property through the prototype chain', () => {
    expect(isTableQueryRefusalReason('toString')).toBe(false);
  });
});
