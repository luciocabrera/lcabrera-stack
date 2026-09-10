import { describe, expect, it } from 'vite-plus/test';

import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertColumnAxis } from './assert-column-axis.util.ts';
import { POSTGRES_MAX_HEAP_ATTRIBUTES } from './group-query-builder.constants.ts';

const dimension = (column: string): ColumnGroupingCapability => ({
  aggregates: ['count'],
  canGroup: true,
  column,
  distinctEstimate: 8,
  periods: [],
  role: 'dimension',
  typeName: 'text',
});

const ALLOWED = ['region', 'year', 'amount'];

const capabilities: Readonly<Record<string, ColumnGroupingCapability>> = {
  amount: {
    aggregates: ['sum'],
    canGroup: false,
    column: 'amount',
    periods: [],
    refusal: 'unique-ish',
    role: 'fact',
    typeName: 'numeric',
  },
  region: dimension('region'),
  year: dimension('year'),
};

const args = {
  allowedColumns: ALLOWED,
  capabilities,
  keys: ['region'],
  measureCount: 1,
};

describe('assertColumnAxis', () => {
  it('accepts a groupable axis within the caller ceiling', () => {
    expect(() =>
      assertColumnAxis({
        ...args,
        columnAxis: {
          key: 'year',
          maxDistinct: 10,
          values: [2022, 2023],
        },
      }),
    ).not.toThrow();
  });

  it('refuses a non-positive maxDistinct as a caller error, not a grouping refusal', () => {
    expect(() =>
      assertColumnAxis({
        ...args,
        columnAxis: { key: 'year', maxDistinct: 0, values: [] },
      }),
    ).toThrow('positive integer');
  });

  it('refuses an axis that is already a row key', () => {
    expect(() =>
      assertColumnAxis({
        ...args,
        columnAxis: { key: 'region', maxDistinct: 10, values: ['PE'] },
        keys: ['region'],
      }),
    ).toThrow(GroupingRefusedError);
  });

  it('refuses an axis the catalogue will not group', () => {
    expect(() =>
      assertColumnAxis({
        ...args,
        columnAxis: { key: 'amount', maxDistinct: 10, values: [1] },
      }),
    ).toThrow(/not a legal column axis: unique-ish/);
  });

  it('refuses when the supplied values exceed the caller ceiling, naming the column', () => {
    expect(() =>
      assertColumnAxis({
        ...args,
        columnAxis: {
          key: 'year',
          maxDistinct: 2,
          values: [2021, 2022, 2023],
        },
      }),
    ).toThrow(
      'Column "year" has 3 distinct values, past the configured 2 column-axis ceiling.',
    );
  });

  it('refuses a projection that would exceed Postgres heap attributes', () => {
    const values = Array.from(
      { length: POSTGRES_MAX_HEAP_ATTRIBUTES },
      (_, index) => index,
    );

    expect(() =>
      assertColumnAxis({
        ...args,
        columnAxis: {
          key: 'year',
          maxDistinct: POSTGRES_MAX_HEAP_ATTRIBUTES,
          values,
        },
        measureCount: 1,
      }),
    ).toThrow(
      `past Postgres's ${POSTGRES_MAX_HEAP_ATTRIBUTES}-attribute heap limit`,
    );
  });

  it('holds an unexpanded count(*) as one attribute, not one per axis value', () => {
    const values = Array.from({ length: 800 }, (_, index) => index);
    const columnAxis = {
      key: 'year',
      maxDistinct: 800,
      values,
    } as const;

    expect(() =>
      assertColumnAxis({
        ...args,
        columnAxis,
        measureCount: 2,
      }),
    ).toThrow(
      `past Postgres's ${POSTGRES_MAX_HEAP_ATTRIBUTES}-attribute heap limit`,
    );

    expect(() =>
      assertColumnAxis({
        ...args,
        columnAxis,
        fixedAggregateCount: 1,
        measureCount: 1,
      }),
    ).not.toThrow();
  });
});
