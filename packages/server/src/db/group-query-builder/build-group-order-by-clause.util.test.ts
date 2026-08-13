import { describe, expect, it } from 'vite-plus/test';

import { buildOrderByClause } from '../query-builder/build-order-by-clause.util.ts';
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

  it('emits, for a single flat grouping set, what the flat builder emits', () => {
    // The degenerate case checked against the other builder rather than against
    // a string copied out of it: a hand-written expectation stays green when
    // `buildOrderByClause` changes, which is exactly when the two would drift.
    const sort = [
      { direction: 'desc' as const, key: 'order_status' },
      { direction: 'asc' as const, key: 'shipping_country' },
    ];

    expect(clause({ sort })).toBe(
      buildOrderByClause({
        sort: sort.map(({ direction, key }) => ({ column: key, direction })),
      }),
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

  it('keeps every GROUPING term ASC whichever key the user reversed', () => {
    // The hierarchy cannot invert: a descending key reverses the order of the
    // parents, and each parent's subtotal still lands after its own children.
    expect(
      clause({
        sets: ROLLUP,
        sort: [
          { direction: 'desc', key: 'order_status' },
          { direction: 'desc', key: 'shipping_country' },
        ],
      }),
    ).toBe(
      'ORDER BY GROUPING("order_status") ASC, "order_status" DESC, ' +
        'GROUPING("shipping_country") ASC, "shipping_country" DESC',
    );
  });

  it('flips only the GROUPING terms for subtotalPlacement first', () => {
    expect(clause({ sets: ROLLUP, subtotalPlacement: 'first' })).toBe(
      'ORDER BY GROUPING("order_status") DESC, "order_status" ASC, ' +
        'GROUPING("shipping_country") DESC, "shipping_country" ASC',
    );
  });

  it('splices an aggregate sort into the innermost level', () => {
    // §1.7(d) of the planning document, proven against a live database:
    // `GROUPING(a), a, GROUPING(b), sum(v) DESC` sorts leaves within each
    // parent and leaves the tree intact.
    expect(
      clause({
        sets: ROLLUP,
        sort: [{ aggregateAlias: 'sum_total_amount', direction: 'desc' }],
      }),
    ).toBe(
      'ORDER BY GROUPING("order_status") ASC, "order_status" ASC, ' +
        'GROUPING("shipping_country") ASC, "sum_total_amount" DESC, ' +
        '"shipping_country" ASC',
    );
  });

  it('keeps the innermost key as the last term, as the aggregate tiebreak', () => {
    // Without it, two leaves with equal aggregates have no defined order —
    // a result set that reshuffles between two identical requests.
    expect(
      clause({
        sets: ROLLUP,
        sort: [{ aggregateAlias: 'count_rows', direction: 'asc' }],
      }).endsWith('"shipping_country" ASC'),
    ).toBe(true);
  });

  it('never puts an aggregate term ahead of an ancestor key', () => {
    // The discriminating property: whatever else the clause contains, every key
    // above the innermost is separated before the aggregate is consulted.
    const terms = clause({
      sets: ROLLUP,
      sort: [
        { direction: 'asc', key: 'order_status' },
        { aggregateAlias: 'sum_total_amount', direction: 'desc' },
      ],
    })
      .replace('ORDER BY ', '')
      .split(', ');

    expect(terms.indexOf('"order_status" ASC')).toBeLessThan(
      terms.indexOf('"sum_total_amount" DESC'),
    );
  });

  it('refuses an aggregate sort that would rank an ancestor', () => {
    expect(() =>
      clause({
        sets: ROLLUP,
        sort: [
          { aggregateAlias: 'count_rows', direction: 'desc' },
          { direction: 'asc', key: 'order_status' },
        ],
      }),
    ).toThrow('never rank an ancestor');
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
