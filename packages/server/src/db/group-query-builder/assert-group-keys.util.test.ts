import { describe, expect, it } from 'vite-plus/test';

import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { assertGroupKeys } from './assert-group-keys.util.ts';

const ALLOWED = ['order_status', 'shipping_country', 'city', 'priority', 'doc'];

const capability = (
  overrides: Partial<ColumnGroupingCapability>,
): ColumnGroupingCapability => ({
  aggregates: ['count', 'countDistinct', 'max', 'min'],
  canGroup: true,
  column: 'c',
  role: 'dimension',
  typeName: 'text',
  ...overrides,
});

const CAPABILITIES: Readonly<Record<string, ColumnGroupingCapability>> = {
  city: capability({ column: 'city' }),
  doc: capability({
    aggregates: ['count'],
    canGroup: false,
    column: 'doc',
    refusal: 'not-a-dimension',
    role: 'unsupported',
    typeName: 'jsonb',
  }),
  order_status: capability({ column: 'order_status' }),
  priority: capability({ column: 'priority' }),
  shipping_country: capability({ column: 'shipping_country' }),
};

const assert = (keys: readonly string[]) =>
  assertGroupKeys({
    allowedColumns: ALLOWED,
    capabilities: CAPABILITIES,
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
          secret: capability({ column: 'secret' }),
        },
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
        keys: ['ghost'],
      }),
    ).toThrow('No grouping capability was resolved');
  });

  it('carries the catalogue’s own refusal reason through', () => {
    expect(() => assert(['doc'])).toThrow('not-a-dimension');
  });
});
