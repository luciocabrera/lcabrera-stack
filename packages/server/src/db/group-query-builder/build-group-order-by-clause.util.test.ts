import { describe, expect, it } from 'vite-plus/test';

import { buildGroupOrderByClause } from './build-group-order-by-clause.util.ts';
import { expandGroupingSets } from './expand-grouping-sets.util.ts';

const KEYS = ['order_status', 'shipping_country'];
const FLAT = expandGroupingSets({ grouping: 'flat', keys: KEYS });
const ROLLUP = expandGroupingSets({ grouping: 'rollup', keys: KEYS });

const clause = (
  overrides: Partial<Parameters<typeof buildGroupOrderByClause>[0]> = {},
) =>
  buildGroupOrderByClause({
    aggregateAliases: ['count_rows', 'sum_total_amount'],
    keys: KEYS,
    sets: FLAT,
    ...overrides,
  });

describe('buildGroupOrderByClause', () => {
  it('emits no GROUPING term when no key is ever rolled up', () => {
    // A flat grouping must produce exactly what the ungrouped builder would,
    // or the two orderings diverge for no reason.
    expect(clause()).toBe(
      'ORDER BY "order_status" ASC, "shipping_country" ASC',
    );
  });

  it('leads each key with its GROUPING term under a rollup', () => {
    expect(clause({ sets: ROLLUP })).toBe(
      'ORDER BY GROUPING("order_status") ASC, "order_status" ASC, ' +
        'GROUPING("shipping_country") ASC, "shipping_country" ASC',
    );
  });

  it('applies the user direction to the value term only', () => {
    // The subtotal stays a footer under a DESC key — which is why this cannot
    // reuse the flat ORDER BY builder.
    expect(
      clause({
        sets: ROLLUP,
        sort: [{ direction: 'desc', key: 'order_status' }],
      }),
    ).toBe(
      'ORDER BY GROUPING("order_status") ASC, "order_status" DESC, ' +
        'GROUPING("shipping_country") ASC, "shipping_country" ASC',
    );
  });

  it('flips only the GROUPING terms for subtotalPlacement first', () => {
    expect(clause({ sets: ROLLUP, subtotalPlacement: 'first' })).toBe(
      'ORDER BY GROUPING("order_status") DESC, "order_status" ASC, ' +
        'GROUPING("shipping_country") DESC, "shipping_country" ASC',
    );
  });

  it('appends an aggregate sort after every key term', () => {
    expect(
      clause({
        sets: ROLLUP,
        sort: [{ aggregateAlias: 'sum_total_amount', direction: 'desc' }],
      }),
    ).toBe(
      'ORDER BY GROUPING("order_status") ASC, "order_status" ASC, ' +
        'GROUPING("shipping_country") ASC, "shipping_country" ASC, ' +
        '"sum_total_amount" DESC',
    );
  });

  it('keeps key terms first even when the aggregate sort is listed first', () => {
    // This is the structural guarantee: an aggregate can order leaves within a
    // parent but can never be hoisted above a key and reorder the tree.
    expect(
      clause({
        sets: ROLLUP,
        sort: [
          { aggregateAlias: 'count_rows', direction: 'desc' },
          { direction: 'asc', key: 'order_status' },
        ],
      }),
    ).toMatch(/^ORDER BY GROUPING\("order_status"\)/);
  });

  it('never emits a NULLS keyword', () => {
    // Emitting one would break build-keyset-comparison.util.ts, which depends
    // on Postgres's default placement.
    expect(clause({ sets: ROLLUP })).not.toContain('NULLS');
  });

  it('refuses a sort on a column that is not a group key', () => {
    expect(() => clause({ sort: [{ direction: 'asc', key: 'city' }] })).toThrow(
      'it is not one of this query',
    );
  });

  it('refuses a sort on an alias this query does not project', () => {
    expect(() =>
      clause({
        sort: [{ aggregateAlias: 'avg_total_amount', direction: 'asc' }],
      }),
    ).toThrow('it is not one of this query');
  });
});
