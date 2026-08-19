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
    // 3·5 detail + 3 subtotal + 1 grand total. Derived from the emitted sets, so
    // it cannot drift from the SQL the same expander builds.
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
    // Treating the missing factor as 1 would let the widest column in the
    // request be the one that hides the cost — the guard would then pass exactly
    // the query it exists to catch.
    const known = estimate({ grouping: 'flat', keys: ['a'] });
    const withUnknown = estimate({
      grouping: 'flat',
      keys: ['a', 'unanalysed'],
    });

    expect(known).toEqual({ kind: 'known', rows: 3 });
    expect(withUnknown.kind).toBe('unknown');
  });

  it('reaches ∏(dₖ+1) for a cube with no formula of its own', () => {
    // 4·6·8. The `+1` per key is the subset that omits it, and it falls out of
    // summing over the emitted sets — nothing in the estimator knows what a
    // cube is, which is the property worth pinning.
    expect(estimate({ grouping: 'cube', keys: ['a', 'b', 'c'] })).toEqual({
      kind: 'known',
      rows: 192,
    });
  });

  it('bounds a cube above the rollup over the same keys', () => {
    // Cube's sets are a superset of rollup's, so its bound can never be the
    // smaller of the two — the ordering a guard rail depends on to refuse the
    // more expensive mode first.
    const keys = ['a', 'b', 'c'];
    const cube = estimate({ grouping: 'cube', keys });
    const rollup = estimate({ grouping: 'rollup', keys });

    expect(cube.kind === 'known' && rollup.kind === 'known').toBe(true);
    expect(cube).toEqual({ kind: 'known', rows: 192 });
    expect(rollup).toEqual({ kind: 'known', rows: 124 });
  });

  it('refuses to guess for a cube too, on one missing factor', () => {
    // The rail that cannot enforce cube's depth cap, stated where it is
    // observable: an unanalysed key makes the whole bound unknown, and ADR-066
    // answers unknown with warn-and-proceed. That is why the cap is asserted at
    // construction instead (`assert-group-depth.util.ts`).
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
