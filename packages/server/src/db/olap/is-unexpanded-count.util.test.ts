import { describe, expect, it } from 'vite-plus/test';

import { isUnexpandedCount } from './is-unexpanded-count.util';

describe('isUnexpandedCount', () => {
  it('accepts the leading count(*) a grouped read prepends', () => {
    expect(isUnexpandedCount({ alias: 'count_rows', fn: 'count' })).toBe(true);
  });

  it('rejects a count that belongs to a column axis', () => {
    expect(
      isUnexpandedCount({
        alias: 'count_rows_c0',
        axis: { value: 'Pending' },
        fn: 'count',
      }),
    ).toBe(false);
  });

  it('rejects a count of a named column', () => {
    expect(
      isUnexpandedCount({
        alias: 'count_amount',
        column: 'amount',
        fn: 'count',
      }),
    ).toBe(false);
  });
});
