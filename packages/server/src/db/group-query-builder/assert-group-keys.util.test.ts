import { describe, expect, it } from 'vite-plus/test';

import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { assertGroupKeys } from './assert-group-keys.util.ts';

const ALLOWED = ['order_status', 'shipping_country', 'city', 'priority', 'doc'];

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
    column: 'doc',
    periods: [],
    refusal: 'not-a-dimension',
    role: 'unsupported',
    typeName: 'jsonb',
  },
  order_status: groupable('order_status'),
  priority: groupable('priority'),
  shipping_country: groupable('shipping_country'),
};

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
    expect(() =>
      assert(['order_status', 'shipping_country', 'city', 'priority', 'doc']),
    ).toThrow('at most 4 group keys');
  });

  it('refuses a repeated key', () => {
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

const dated = (periods: readonly ('day' | 'month' | 'quarter' | 'year')[]) => ({
  ...groupable('order_date'),
  canGroup: false as const,
  periods,
  refusal: 'too-many-distinct' as const,
});

describe('a granularity on a group key', () => {
  it('is accepted on a column that offers it, even when the raw column is refused', () => {
    expect(() =>
      assertGroupKeys({
        allowedColumns: ['order_date'],
        capabilities: { order_date: dated(['month', 'year']) },
        grouping: 'flat',
        keys: ['order_date'],
        periods: { order_date: 'month' },
      }),
    ).not.toThrow();
  });

  it('is refused naming the column and the granularity, and what is on offer', () => {
    expect(() =>
      assertGroupKeys({
        allowedColumns: ['order_date'],
        capabilities: { order_date: dated(['month', 'year']) },
        grouping: 'flat',
        keys: ['order_date'],
        periods: { order_date: 'day' },
      }),
    ).toThrow(/"order_date" cannot be grouped by day; it offers month, year/);
  });

  it('says so plainly when the column has no granularity at all', () => {
    expect(() =>
      assertGroupKeys({
        allowedColumns: ['status'],
        capabilities: { status: groupable('status') },
        grouping: 'flat',
        keys: ['status'],
        periods: { status: 'month' },
      }),
    ).toThrow(/no date or timestamp to truncate/);
  });

  it('refuses a granularity naming a column that is not a group key', () => {
    expect(() =>
      assertGroupKeys({
        allowedColumns: ['status', 'order_date'],
        capabilities: {
          order_date: dated(['month']),
          status: groupable('status'),
        },
        grouping: 'flat',
        keys: ['status'],
        periods: { order_date: 'month' },
      }),
    ).toThrow(/not one of the group keys/);
  });

  it('still refuses an ungroupable column that carries no granularity', () => {
    expect(() =>
      assertGroupKeys({
        allowedColumns: ['order_date'],
        capabilities: { order_date: dated(['month']) },
        grouping: 'flat',
        keys: ['order_date'],
      }),
    ).toThrow(/not a legal group key/);
  });
});
