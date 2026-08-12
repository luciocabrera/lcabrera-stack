import { describe, expect, it } from 'vite-plus/test';

import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { assertGroupAggregates } from './assert-group-aggregates.util.ts';

const ALLOWED = ['total_amount', 'shipping_country', 'doc', 'is_gift'];

const CAPABILITIES: Readonly<Record<string, ColumnGroupingCapability>> = {
  // Read off a live catalogue: a boolean has no min/max aggregate, and jsonb
  // has nothing but count.
  doc: {
    aggregates: ['count'],
    canGroup: false,
    column: 'doc',
    refusal: 'not-a-dimension',
    role: 'unsupported',
    typeName: 'jsonb',
  },
  is_gift: {
    aggregates: ['boolAnd', 'boolOr', 'count', 'countDistinct'],
    canGroup: true,
    column: 'is_gift',
    role: 'dimension',
    typeName: 'bool',
  },
  shipping_country: {
    aggregates: ['count', 'countDistinct', 'max', 'min'],
    canGroup: true,
    column: 'shipping_country',
    role: 'dimension',
    typeName: 'text',
  },
  total_amount: {
    aggregates: ['avg', 'count', 'countDistinct', 'max', 'min', 'sum'],
    canGroup: false,
    column: 'total_amount',
    refusal: 'unique-ish',
    role: 'fact',
    typeName: 'numeric',
  },
};

const assert = (
  aggregates: Parameters<typeof assertGroupAggregates>[0]['aggregates'],
) =>
  assertGroupAggregates({
    aggregates,
    allowedColumns: ALLOWED,
    capabilities: CAPABILITIES,
  });

describe('assertGroupAggregates', () => {
  it('accepts aggregates the catalogue offers for that column', () => {
    expect(() =>
      assert([
        { fn: 'count' },
        { column: 'total_amount', fn: 'sum' },
        { column: 'shipping_country', fn: 'countDistinct' },
      ]),
    ).not.toThrow();
  });

  it('accepts an aggregate on a column that is not a legal group key', () => {
    // A fact is exactly the thing you aggregate and do not group by, so
    // `canGroup: false` must not disqualify it here.
    expect(() => assert([{ column: 'total_amount', fn: 'avg' }])).not.toThrow();
  });

  it('refuses a grouping with no aggregates', () => {
    expect(() => assert([])).toThrow('at least one aggregate');
  });

  it('refuses a type-illegal aggregate, naming the type and what is offered', () => {
    // `min(jsonb)` does not exist; without this the query reaches Postgres and
    // comes back as a 500 with a driver error in it.
    expect(() => assert([{ column: 'doc', fn: 'min' }])).toThrow(
      '"min" is not legal for column "doc" (jsonb); the catalogue offers count.',
    );
  });

  it('refuses min on a boolean, which Postgres does not define either', () => {
    expect(() => assert([{ column: 'is_gift', fn: 'max' }])).toThrow(
      'not legal for column "is_gift"',
    );
  });

  it('refuses a bare aggregate other than count', () => {
    expect(() => assert([{ fn: 'sum' }])).toThrow('needs a column');
  });

  it('refuses a second countDistinct', () => {
    expect(() =>
      assert([
        { column: 'shipping_country', fn: 'countDistinct' },
        { column: 'total_amount', fn: 'countDistinct' },
      ]),
    ).toThrow('at most 1 countDistinct');
  });

  it('refuses an uppercase identifier', () => {
    expect(() => assert([{ column: 'Total_Amount', fn: 'sum' }])).toThrow(
      'Unsafe identifier',
    );
  });

  it('refuses a column outside the allowlist', () => {
    expect(() =>
      assertGroupAggregates({
        aggregates: [{ column: 'salary', fn: 'sum' }],
        allowedColumns: ALLOWED,
        capabilities: {
          ...CAPABILITIES,
          salary: {
            aggregates: ['sum'],
            canGroup: false,
            column: 'salary',
            refusal: 'unique-ish',
            role: 'fact',
            typeName: 'numeric',
          },
        },
      }),
    ).toThrow('not in the allowed list');
  });

  it('refuses a column with no resolved capability', () => {
    expect(() =>
      assertGroupAggregates({
        aggregates: [{ column: 'ghost', fn: 'count' }],
        allowedColumns: [...ALLOWED, 'ghost'],
        capabilities: CAPABILITIES,
      }),
    ).toThrow('No grouping capability was resolved');
  });
});
