import { describe, expect, it } from 'vite-plus/test';

import { buildGroupingSetsClause } from './build-grouping-sets-clause.util.ts';
import { expandGroupingSets } from './expand-grouping-sets.util.ts';

describe('buildGroupingSetsClause', () => {
  it('renders a flat grouping as a single set', () => {
    expect(
      buildGroupingSetsClause({ sets: [['order_status', 'shipping_country']] }),
    ).toBe('GROUP BY GROUPING SETS (("order_status", "shipping_country"))');
  });

  it('renders the grand total as an empty set rather than omitting it', () => {
    expect(buildGroupingSetsClause({ sets: [[]] })).toBe(
      'GROUP BY GROUPING SETS (())',
    );
  });

  it('renders a depth-2 rollup as its three explicit sets', () => {
    const sets = expandGroupingSets({
      grouping: 'rollup',
      keys: ['order_status', 'shipping_country'],
    });

    expect(buildGroupingSetsClause({ sets })).toBe(
      'GROUP BY GROUPING SETS (("order_status", "shipping_country"), ("order_status"), ())',
    );
  });

  it('quotes every key', () => {
    expect(buildGroupingSetsClause({ sets: [['select']] })).toBe(
      'GROUP BY GROUPING SETS (("select"))',
    );
  });
});
