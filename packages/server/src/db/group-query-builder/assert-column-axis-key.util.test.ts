import { describe, expect, it } from 'vite-plus/test';

import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertColumnAxisKey } from './assert-column-axis-key.util.ts';

const dimension = (column: string): ColumnGroupingCapability => ({
  aggregates: ['count'],
  canGroup: true,
  column,
  distinctEstimate: 8,
  periods: [],
  role: 'dimension',
  typeName: 'text',
});

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
  allowedColumns: ['region', 'year', 'amount'],
  capabilities,
  keys: ['region'],
};

describe('assertColumnAxisKey', () => {
  it('accepts a groupable axis that is not a row key', () => {
    expect(() => assertColumnAxisKey({ ...args, key: 'year' })).not.toThrow();
  });

  it('refuses an axis that is already a row key', () => {
    expect(() => assertColumnAxisKey({ ...args, key: 'region' })).toThrow(
      GroupingRefusedError,
    );
  });

  it('refuses an axis the catalogue will not group', () => {
    expect(() => assertColumnAxisKey({ ...args, key: 'amount' })).toThrow(
      /not a legal column axis: unique-ish/,
    );
  });
});
