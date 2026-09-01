import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnGroupingCapability,
  GroupingMode,
} from './group-query-builder.types.ts';

import { estimateGroupCardinality } from './estimate-group-cardinality.util.ts';

type CapabilityArgs = {
  readonly column: string;
  readonly distinctEstimate?: number;
};

const capability = ({
  column,
  distinctEstimate,
}: CapabilityArgs): ColumnGroupingCapability => ({
  aggregates: ['count'],
  canGroup: true,
  column,
  periods: [],
  role: 'dimension',
  typeName: 'text',
  ...(distinctEstimate !== undefined && { distinctEstimate }),
});

const CAPABILITIES: Readonly<Record<string, ColumnGroupingCapability>> = {
  a: capability({ column: 'a', distinctEstimate: 3 }),
  b: capability({ column: 'b', distinctEstimate: 5 }),
  c: capability({ column: 'c', distinctEstimate: 7 }),
  unanalysed: capability({ column: 'unanalysed' }),
};

type EstimateArgs = {
  readonly grouping: GroupingMode;
  readonly keys: readonly string[];
};

const estimate = ({ grouping, keys }: EstimateArgs) =>
  estimateGroupCardinality({ capabilities: CAPABILITIES, grouping, keys });

describe('estimateGroupCardinality', () => {
  it('multiplies the distinct estimates for a flat grouping', () => {
    expect(estimate({ grouping: 'flat', keys: ['a', 'b', 'c'] })).toEqual({
      kind: 'known',
      rows: 105,
    });
  });

  it('adds one row per rolled-up level plus the grand total', () => {
    expect(estimate({ grouping: 'rollup', keys: ['a', 'b'] })).toEqual({
      kind: 'known',
      rows: 19,
    });
  });

  it('counts the grand total as a row even with no keys left', () => {
    expect(estimate({ grouping: 'rollup', keys: ['a'] })).toEqual({
      kind: 'known',
      rows: 4,
    });
  });

  it('names every key it has no estimate for', () => {
    expect(estimate({ grouping: 'flat', keys: ['a', 'unanalysed'] })).toEqual({
      columns: ['unanalysed'],
      kind: 'unknown',
    });
  });

  it('refuses to guess when one factor is missing', () => {
    const known = estimate({ grouping: 'flat', keys: ['a'] });
    const withUnknown = estimate({
      grouping: 'flat',
      keys: ['a', 'unanalysed'],
    });

    expect(known).toEqual({ kind: 'known', rows: 3 });
    expect(withUnknown.kind).toBe('unknown');
  });

  it('reaches ∏(dₖ+1) for a cube with no formula of its own', () => {
    expect(estimate({ grouping: 'cube', keys: ['a', 'b', 'c'] })).toEqual({
      kind: 'known',
      rows: 192,
    });
  });

  it('bounds a cube above the rollup over the same keys', () => {
    const keys = ['a', 'b', 'c'];
    const cube = estimate({ grouping: 'cube', keys });
    const rollup = estimate({ grouping: 'rollup', keys });

    expect(cube.kind === 'known' && rollup.kind === 'known').toBe(true);
    expect(cube).toEqual({ kind: 'known', rows: 192 });
    expect(rollup).toEqual({ kind: 'known', rows: 124 });
  });

  it('refuses to guess for a cube too, on one missing factor', () => {
    expect(estimate({ grouping: 'cube', keys: ['a', 'unanalysed'] })).toEqual({
      columns: ['unanalysed'],
      kind: 'unknown',
    });
  });

  it('treats a column with no capability at all as unknown', () => {
    expect(
      estimateGroupCardinality({
        capabilities: CAPABILITIES,
        grouping: 'flat',
        keys: ['ghost'],
      }),
    ).toEqual({ columns: ['ghost'], kind: 'unknown' });
  });
});
