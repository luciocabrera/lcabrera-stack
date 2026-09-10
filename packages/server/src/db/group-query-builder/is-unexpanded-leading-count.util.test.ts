import { describe, expect, it } from 'vite-plus/test';

import { isUnexpandedLeadingCount } from './is-unexpanded-leading-count.util.ts';

describe('isUnexpandedLeadingCount', () => {
  it('accepts a bare count(*)', () => {
    expect(isUnexpandedLeadingCount({ fn: 'count' })).toBe(true);
  });

  it('rejects a count over a column', () => {
    expect(isUnexpandedLeadingCount({ column: 'id', fn: 'count' })).toBe(false);
  });

  it('rejects a count that already carries a FILTER', () => {
    expect(
      isUnexpandedLeadingCount({
        filters: [{ column: 'year', operator: 'eq', value: 2022 }],
        fn: 'count',
      }),
    ).toBe(false);
  });
});
