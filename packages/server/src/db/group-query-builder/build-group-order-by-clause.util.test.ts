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
    expect(clause()).toBe(
      'ORDER BY "order_status" ASC, "shipping_country" ASC',
    );
  });

  it('emits, for a single flat grouping set, what the flat builder emits', () => {
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
    expect(
      clause({
        sets: ROLLUP,
        sort: [{ aggregateAlias: 'count_rows', direction: 'asc' }],
      }).endsWith('"shipping_country" ASC'),
    ).toBe(true);
  });

  it('never puts an aggregate term ahead of an ancestor key', () => {
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
