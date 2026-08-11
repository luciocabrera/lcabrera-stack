import { describe, expect, it } from 'vite-plus/test';

import type { ColumnCapabilityRow } from './group-query-builder.types.ts';

import { resolveColumnCapability } from './resolve-column-capability.util.ts';

/**
 * Every row below is a real catalogue answer, read off a live Postgres fixture
 * carrying these types rather than composed to fit the assertions.
 */
const row = (overrides: Partial<ColumnCapabilityRow>): ColumnCapabilityRow => ({
  aggregates: ['count', 'max', 'min'],
  column: 'c',
  hasEquality: true,
  hasStats: true,
  nDistinct: 7,
  relTuples: 2000,
  typeCategory: 'S',
  typeName: 'text',
  ...overrides,
});

describe('resolveColumnCapability', () => {
  it('accepts a low-cardinality string dimension', () => {
    expect(resolveColumnCapability(row({ column: 'country' }))).toEqual({
      aggregates: ['count', 'countDistinct', 'max', 'min'],
      canGroup: true,
      column: 'country',
      distinctEstimate: 7,
      role: 'dimension',
      typeName: 'text',
    });
  });

  it('omits the refusal entirely when a column is groupable', () => {
    expect(resolveColumnCapability(row({}))).not.toHaveProperty('refusal');
  });

  // ADR-058's central case: Postgres would group this happily.
  it('refuses jsonb as not a dimension even though it has equality', () => {
    const capability = resolveColumnCapability(
      row({
        aggregates: ['count'],
        column: 'doc',
        hasEquality: true,
        nDistinct: 11,
        typeCategory: 'U',
        typeName: 'jsonb',
      }),
    );

    expect(capability.canGroup).toBe(false);
    expect(capability.refusal).toBe('not-a-dimension');
    expect(capability.aggregates).toEqual([]);
  });

  it('prefers the role refusal over the operator one for a point column', () => {
    // Both apply. "Not a dimension" is a sentence a user understands; "no
    // equality operator for type point" is not.
    expect(
      resolveColumnCapability(
        row({
          aggregates: ['count'],
          column: 'loc',
          hasEquality: false,
          nDistinct: 0,
          typeCategory: 'G',
          typeName: 'point',
        }),
      ).refusal,
    ).toBe('not-a-dimension');
  });

  it('refuses a dimension-categorised type that resolves no equality operator', () => {
    // Gate 2's real job: an extension or domain type Gate 1 cannot know about.
    expect(
      resolveColumnCapability(
        row({
          column: 'weird',
          hasEquality: false,
          typeCategory: 'S',
          typeName: 'exotic_text',
        }),
      ).refusal,
    ).toBe('no-equality-operator');
  });

  it('reads n_distinct = 0 as a missing operator, never as unknown', () => {
    expect(
      resolveColumnCapability(
        row({
          column: 'weird',
          hasEquality: true,
          nDistinct: 0,
          typeCategory: 'S',
        }),
      ).refusal,
    ).toBe('no-equality-operator');
  });

  it('refuses a primary key as unique-ish rather than as too many distinct', () => {
    const capability = resolveColumnCapability(
      row({
        aggregates: ['avg', 'count', 'max', 'min', 'sum'],
        column: 'order_id',
        nDistinct: -1,
        typeCategory: 'N',
        typeName: 'int4',
      }),
    );

    expect(capability.refusal).toBe('unique-ish');
    expect(capability.distinctEstimate).toBe(2000);
    // Still a perfectly good measure — the refusal is about the key only.
    expect(capability.aggregates).toContain('sum');
  });

  it('accepts a fact whose statistics show it behaving like a dimension', () => {
    const capability = resolveColumnCapability(
      row({
        aggregates: ['avg', 'count', 'max', 'min', 'sum'],
        column: 'quantity',
        nDistinct: 13,
        typeCategory: 'N',
        typeName: 'numeric',
      }),
    );

    expect(capability.canGroup).toBe(true);
    expect(capability.role).toBe('fact');
  });

  it('refuses a fact with no statistics to demonstrate low cardinality', () => {
    expect(
      resolveColumnCapability(
        row({
          column: 'amount',
          hasStats: false,
          nDistinct: 0,
          typeCategory: 'N',
          typeName: 'numeric',
        }),
      ).refusal,
    ).toBe('stats-unavailable');
  });

  it('still groups a dimension whose statistics are unavailable', () => {
    // Warn and proceed: refusing here would make grouping dead on a freshly
    // restored database, and the row-limit backstop covers the risk.
    const capability = resolveColumnCapability(
      row({ column: 'country', hasStats: false, nDistinct: 0 }),
    );

    expect(capability.canGroup).toBe(true);
    expect(capability.distinctEstimate).toBeUndefined();
  });

  it('refuses a dimension with more distinct values than a key may have', () => {
    expect(
      resolveColumnCapability(
        row({ column: 'note', nDistinct: 5000, relTuples: 1_000_000 }),
      ).refusal,
    ).toBe('too-many-distinct');
  });

  it('offers a boolean the pair Postgres actually has', () => {
    const capability = resolveColumnCapability(
      row({
        aggregates: ['bool_and', 'bool_or', 'count'],
        column: 'is_active',
        nDistinct: 2,
        typeCategory: 'B',
        typeName: 'bool',
      }),
    );

    expect(capability.canGroup).toBe(true);
    expect(capability.aggregates).toEqual([
      'boolAnd',
      'boolOr',
      'count',
      'countDistinct',
    ]);
  });
});
