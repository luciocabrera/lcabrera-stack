import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnAnalyticalRole,
  DistinctEstimate,
} from './group-query-builder.types.ts';

import { refuseGroupKey } from './refuse-group-key.util.ts';

type ArgsOverrides = {
  readonly estimate?: DistinctEstimate;
  readonly hasEquality?: boolean;
  readonly relTuples?: number;
  readonly role?: ColumnAnalyticalRole;
  readonly typeName?: string;
  readonly typeNamespace?: string;
};

const args = (overrides: ArgsOverrides) => ({
  estimate: { kind: 'known', value: 24 } as DistinctEstimate,
  hasEquality: true,
  relTuples: 2000,
  role: 'dimension' as ColumnAnalyticalRole,
  typeName: 'text',
  typeNamespace: 'pg_catalog',
  ...overrides,
});

describe('refuseGroupKey', () => {
  it('accepts a low-cardinality dimension', () => {
    expect(refuseGroupKey(args({}))).toBeUndefined();
  });

  it('reports the role before the missing operator when both apply', () => {
    expect(
      refuseGroupKey(
        args({
          estimate: { kind: 'undefinedDistinctness' },
          hasEquality: false,
          role: 'unsupported',
        }),
      ),
    ).toBe('not-a-dimension');
  });

  it('reports a missing operator for a dimension-categorised type', () => {
    expect(refuseGroupKey(args({ hasEquality: false }))).toBe(
      'no-equality-operator',
    );
  });

  it('treats undefined distinctness as the missing operator it is', () => {
    expect(
      refuseGroupKey(args({ estimate: { kind: 'undefinedDistinctness' } })),
    ).toBe('no-equality-operator');
  });

  it('reports a unique-ish column before a too-large one', () => {
    expect(
      refuseGroupKey(
        args({ estimate: { kind: 'known', value: 2000 }, relTuples: 2000 }),
      ),
    ).toBe('unique-ish');
  });

  it('refuses a fact whose low cardinality cannot be demonstrated', () => {
    expect(
      refuseGroupKey(args({ estimate: { kind: 'unknown' }, role: 'fact' })),
    ).toBe('stats-unavailable');
  });

  it('accepts a dimension with no statistics, warning rather than refusing', () => {
    expect(
      refuseGroupKey(args({ estimate: { kind: 'unknown' } })),
    ).toBeUndefined();
  });

  it('refuses a column with more distinct values than a key may have', () => {
    expect(
      refuseGroupKey(
        args({
          estimate: { kind: 'known', value: 5000 },
          relTuples: 1_000_000,
        }),
      ),
    ).toBe('too-many-distinct');
  });

  it('accepts a fact whose statistics show it behaving like a dimension', () => {
    expect(
      refuseGroupKey(
        args({ estimate: { kind: 'known', value: 13 }, role: 'fact' }),
      ),
    ).toBeUndefined();
  });

  it('accepts a uuid whose low cardinality is demonstrated', () => {
    expect(
      refuseGroupKey(
        args({ estimate: { kind: 'known', value: 4 }, typeName: 'uuid' }),
      ),
    ).toBeUndefined();
  });

  it('refuses a uuid with no statistics, unlike an ordinary dimension', () => {
    const noStats = { estimate: { kind: 'unknown' } as DistinctEstimate };

    expect(refuseGroupKey(args({ ...noStats, typeName: 'uuid' }))).toBe(
      'stats-unavailable',
    );
    expect(
      refuseGroupKey(args({ ...noStats, typeName: 'text' })),
    ).toBeUndefined();
  });

  it('does not apply the identifier rule to a uuid from another schema', () => {
    expect(
      refuseGroupKey(
        args({
          estimate: { kind: 'unknown' },
          typeName: 'uuid',
          typeNamespace: 'app',
        }),
      ),
    ).toBeUndefined();
  });

  it('still refuses a primary-key uuid as unique-ish', () => {
    expect(
      refuseGroupKey(
        args({
          estimate: { kind: 'known', value: 2000 },
          relTuples: 2000,
          typeName: 'uuid',
        }),
      ),
    ).toBe('unique-ish');
  });
});
