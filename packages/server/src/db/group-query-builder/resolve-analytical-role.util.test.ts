import { describe, expect, it } from 'vite-plus/test';

import { resolveAnalyticalRole } from './resolve-analytical-role.util.ts';

describe('resolveAnalyticalRole', () => {
  it.each([
    { category: 'S', role: 'dimension', typeName: 'text' },
    { category: 'B', role: 'dimension', typeName: 'bool' },
    { category: 'D', role: 'dimension', typeName: 'timestamptz' },
    { category: 'E', role: 'dimension', typeName: 'mood' },
    { category: 'I', role: 'dimension', typeName: 'inet' },
    { category: 'N', role: 'fact', typeName: 'numeric' },
    { category: 'T', role: 'fact', typeName: 'interval' },
  ] as const)(
    'reads $typeName (category $category) as $role',
    ({ category, role, typeName }) => {
      expect(resolveAnalyticalRole({ typeCategory: category, typeName })).toBe(
        role,
      );
    },
  );

  it('reads interval as a fact rather than a date-like dimension', () => {
    // `interval` sits in its own category, not `D`, and the split is the useful
    // one: a duration is a measure you sum, where a timestamp is a label you
    // group by. Gate 2 then confirms Postgres really does define `sum(interval)`.
    expect(
      resolveAnalyticalRole({ typeCategory: 'T', typeName: 'interval' }),
    ).toBe('fact');
    expect(resolveAnalyticalRole({ typeCategory: 'D', typeName: 'date' })).toBe(
      'dimension',
    );
  });

  it.each([
    { category: 'U', typeName: 'jsonb' },
    { category: 'U', typeName: 'xml' },
    { category: 'U', typeName: 'bytea' },
    { category: 'G', typeName: 'point' },
    { category: 'A', typeName: '_text' },
    { category: 'C', typeName: 'some_composite' },
    { category: 'R', typeName: 'int4range' },
  ])(
    'refuses $typeName, which the Table cannot render as a cell',
    ({ category, typeName }) => {
      expect(resolveAnalyticalRole({ typeCategory: category, typeName })).toBe(
        'unsupported',
      );
    },
  );

  it('admits uuid by name while its category stays refused', () => {
    // The pair that defines the exception. Both rows are category `U`; nothing
    // structural separates them, so the name is the only thing that can. This
    // fails in one direction if the name check is dropped, and in the other if
    // someone reaches the uuid by adding `U` to the category table.
    expect(resolveAnalyticalRole({ typeCategory: 'U', typeName: 'uuid' })).toBe(
      'dimension',
    );
    expect(
      resolveAnalyticalRole({ typeCategory: 'U', typeName: 'jsonb' }),
    ).toBe('unsupported');
  });

  it('admits a uuid whatever category a future Postgres files it under', () => {
    // The name check runs first, so a recategorised `uuid` keeps working. The
    // point of naming it was never the category it happens to sit in.
    expect(resolveAnalyticalRole({ typeCategory: 'Z', typeName: 'uuid' })).toBe(
      'dimension',
    );
  });

  it('defaults an unrecognised category to unsupported', () => {
    // The Gate 1 default that lets the `unsupported` list stay non-exhaustive:
    // a category invented by a future Postgres release is refused, not offered.
    expect(
      resolveAnalyticalRole({ typeCategory: 'Ω', typeName: 'whatever' }),
    ).toBe('unsupported');
  });
});
