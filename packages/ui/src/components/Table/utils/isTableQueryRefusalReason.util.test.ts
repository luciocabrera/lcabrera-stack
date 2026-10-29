import { describe, expect, it } from 'vite-plus/test';

import { isTableQueryRefusalReason } from './isTableQueryRefusalReason.util';
import { TABLE_QUERY_REFUSAL_REASONS } from './refusal.constants';

describe('isTableQueryRefusalReason', () => {
  it.each(Object.keys(TABLE_QUERY_REFUSAL_REASONS))('admits %s', (reason) => {
    expect(isTableQueryRefusalReason(reason)).toBe(true);
  });

  it('refuses a grouping-refusal reason and a token outside the vocabulary', () => {
    expect(isTableQueryRefusalReason('unknown-column')).toBe(false);
    expect(isTableQueryRefusalReason('not-a-reason')).toBe(false);
  });
});
