import { describe, expect, it } from 'vite-plus/test';

import { toColumnAxisAlias } from './to-column-axis-alias.util.ts';

describe('toColumnAxisAlias', () => {
  it('suffixes a zero-based index so the value never has to be an identifier', () => {
    expect(toColumnAxisAlias({ alias: 'sum_total_amount', index: 0 })).toBe(
      'sum_total_amount_c0',
    );
    expect(toColumnAxisAlias({ alias: 'count_rows', index: 12 })).toBe(
      'count_rows_c12',
    );
  });

  it('stays a safe identifier when the base alias is one', () => {
    expect(toColumnAxisAlias({ alias: 'avg_amount', index: 3 })).toMatch(
      /^[a-z_][a-z0-9_]*$/,
    );
  });
});
