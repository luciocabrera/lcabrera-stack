import { describe, expect, it } from 'vite-plus/test';

import {
  MAX_TABLE_COUNT_DISTINCT_AGGREGATES,
  MAX_TABLE_GROUP_KEYS,
  TABLE_AGGREGATE_FNS,
  TABLE_AGGREGATE_LABELS,
} from './Table.constants';

describe('table aggregate vocabulary', () => {
  it('offers every aggregate the label map declares, and no other', () => {
    expect(new Set(TABLE_AGGREGATE_FNS)).toStrictEqual(
      new Set(Object.keys(TABLE_AGGREGATE_LABELS)),
    );
  });

  it('lists each aggregate once', () => {
    expect(TABLE_AGGREGATE_FNS).toHaveLength(new Set(TABLE_AGGREGATE_FNS).size);
  });
});

describe('group key depth cap', () => {
  it('admits more than one key and stays finite', () => {
    expect(MAX_TABLE_GROUP_KEYS).toBeGreaterThan(1);
    expect(Number.isSafeInteger(MAX_TABLE_GROUP_KEYS)).toBe(true);
  });
});

describe('countDistinct budget', () => {
  it('admits at least one and stays finite', () => {
    expect(MAX_TABLE_COUNT_DISTINCT_AGGREGATES).toBeGreaterThan(0);
    expect(Number.isSafeInteger(MAX_TABLE_COUNT_DISTINCT_AGGREGATES)).toBe(
      true,
    );
  });
});
