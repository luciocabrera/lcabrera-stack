import { describe, expect, it } from 'vite-plus/test';

import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertGroupCardinality } from './assert-group-cardinality.util.ts';

type CapabilityArgs = {
  readonly column: string;
  readonly distinctEstimate: number;
};

const capability = ({
  column,
  distinctEstimate,
}: CapabilityArgs): ColumnGroupingCapability => ({
  aggregates: ['count'],
  canGroup: true,
  column,
  distinctEstimate,
  periods: [],
  role: 'dimension',
  typeName: 'text',
});

const CAPABILITIES: Readonly<Record<string, ColumnGroupingCapability>> = {
  city: capability({ column: 'city', distinctEstimate: 900 }),
  country: capability({ column: 'country', distinctEstimate: 60 }),
  region: capability({ column: 'region', distinctEstimate: 4 }),
};

const KEYS = ['country', 'city'];

const assert = (rows: number) =>
  assertGroupCardinality({
    capabilities: CAPABILITIES,
    estimate: { kind: 'known', rows },
    keys: KEYS,
  });

describe('assertGroupCardinality', () => {
  it('says nothing about a grouping under the warn threshold', () => {
    expect(assert(4999)).toBeUndefined();
  });

  it('warns above the warn threshold and still lets it run', () => {
    expect(assert(5001)).toEqual({
      estimatedRows: 5001,
      kind: 'estimate-above-warn-threshold',
    });
  });

  it('runs a grouping right at the refuse threshold', () => {
    // The ceiling is inclusive: 50 000 is allowed, 50 001 is not.
    expect(assert(50_000)).toEqual({
      estimatedRows: 50_000,
      kind: 'estimate-above-warn-threshold',
    });
  });

  it('refuses past the refuse threshold, naming the offending column', () => {
    expect(() => assert(54_000)).toThrow(/Column "city"/);
    expect(() => assert(54_000)).toThrow(/54000 rows/);
  });

  it('carries the offending column and the bound on the typed error', () => {
    // The message is for a human; these two are what the loader edge maps into
    // the serializable union.
    let caught: unknown;

    try {
      assert(54_000);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(GroupingRefusedError);
    expect(caught).toMatchObject({
      column: 'city',
      estimatedRows: 54_000,
      reason: 'estimate-too-large',
    });
  });

  it('warns and proceeds when the statistics are unavailable', () => {
    // The direction that matters: a freshly restored database has no statistics
    // for anything, and refusing there would make grouping look broken exactly
    // where it is most needed. The row limit is the backstop instead.
    expect(
      assertGroupCardinality({
        capabilities: CAPABILITIES,
        estimate: { columns: ['city'], kind: 'unknown' },
        keys: KEYS,
      }),
    ).toEqual({ columns: ['city'], kind: 'stats-unavailable' });
  });

  it('never refuses an unknown estimate, however many keys it covers', () => {
    expect(() =>
      assertGroupCardinality({
        capabilities: CAPABILITIES,
        estimate: { columns: ['city', 'country', 'region'], kind: 'unknown' },
        keys: ['city', 'country', 'region'],
      }),
    ).not.toThrow();
  });
});
