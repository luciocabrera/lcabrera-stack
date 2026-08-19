import { describe, expect, it } from 'vite-plus/test';

import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { assertGroupKeys } from './assert-group-keys.util.ts';

const ALLOWED = ['order_status', 'shipping_country', 'city', 'priority', 'doc'];

/**
 * Only the groupable arm is worth a factory. The refused one has to name its
 * reason — the type will not let it do otherwise — so writing it out is the
 * shorter of the two.
 */
const groupable = (column: string): ColumnGroupingCapability => ({
  aggregates: ['count', 'countDistinct', 'max', 'min'],
  canGroup: true,
  column,
  periods: [],
  role: 'dimension',
  typeName: 'text',
});

const CAPABILITIES: Readonly<Record<string, ColumnGroupingCapability>> = {
  city: groupable('city'),
  doc: {
    aggregates: ['count'],
    canGroup: false,
    periods: [],
    column: 'doc',
    refusal: 'not-a-dimension',
    role: 'unsupported',
    typeName: 'jsonb',
  },
  order_status: groupable('order_status'),
  priority: groupable('priority'),
  shipping_country: groupable('shipping_country'),
};

/**
 * Rollup throughout: this file is about the *catalogue* half of the rules, and
 * the per-mode depth cap is asserted where it lives
 * (`assert-group-depth.util.test.ts`).
 */
const assert = (keys: readonly string[]) =>
  assertGroupKeys({
    allowedColumns: ALLOWED,
    capabilities: CAPABILITIES,
    grouping: 'rollup',
    keys,
  });

describe('assertGroupKeys', () => {
  it('accepts keys the catalogue cleared, up to the depth cap', () => {
    expect(() =>
      assert(['order_status', 'shipping_country', 'city', 'priority']),
    ).not.toThrow();
  });

  it('refuses a grouping with no keys', () => {
    expect(() => assert([])).toThrow('at least one group key');
  });

  it('refuses past the depth cap before any round trip', () => {
    // The point of doing this purely: a request for five keys must never cost
    // a catalogue query to reject.
    expect(() =>
      assert(['order_status', 'shipping_country', 'city', 'priority', 'doc']),
    ).toThrow('at most 4 group keys');
  });

  it('refuses a repeated key', () => {
    // `GROUP BY GROUPING SETS ((a, a))` is legal SQL and produces a column
    // twice, which the driver then folds — so it is refused here instead.
    expect(() => assert(['city', 'city'])).toThrow('must be distinct');
  });

  it('refuses an uppercase identifier', () => {
    expect(() => assert(['City'])).toThrow('Unsafe identifier');
  });

  it('refuses a column outside the allowlist', () => {
    expect(() =>
      assertGroupKeys({
        allowedColumns: ALLOWED,
        capabilities: {
          ...CAPABILITIES,
          secret: groupable('secret'),
        },
        grouping: 'rollup',
        keys: ['secret'],
      }),
    ).toThrow('not in the allowed list');
  });

  it('refuses a column with no resolved capability', () => {
    // A column the catalogue could not see must fail closed, never default to
    // groupable.
    expect(() =>
      assertGroupKeys({
        allowedColumns: [...ALLOWED, 'ghost'],
        capabilities: CAPABILITIES,
        grouping: 'rollup',
        keys: ['ghost'],
      }),
    ).toThrow('No grouping capability was resolved');
  });

  it('carries the catalogue’s own refusal reason through', () => {
    expect(() => assert(['doc'])).toThrow('not-a-dimension');
  });
});
