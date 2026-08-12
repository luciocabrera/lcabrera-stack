import { describe, expect, it } from 'vite-plus/test';

import { resolveAnalyticalRole } from './resolve-analytical-role.util.ts';

describe('resolveAnalyticalRole', () => {
  it.each([
    { category: 'S', role: 'dimension' }, // text, varchar, char, citext
    { category: 'B', role: 'dimension' }, // boolean
    { category: 'D', role: 'dimension' }, // date, timestamp, timestamptz
    { category: 'E', role: 'dimension' }, // enum
    { category: 'I', role: 'dimension' }, // inet, cidr
    { category: 'N', role: 'fact' }, // numeric, int2/4/8, float4/8, money
    { category: 'T', role: 'fact' }, // interval
  ] as const)('reads category $category as $role', ({ category, role }) => {
    expect(resolveAnalyticalRole(category)).toBe(role);
  });

  it('reads interval as a fact rather than a date-like dimension', () => {
    // `interval` sits in its own category, not `D`, and the split is the useful
    // one: a duration is a measure you sum, where a timestamp is a label you
    // group by. Gate 2 then confirms Postgres really does define `sum(interval)`.
    expect(resolveAnalyticalRole('T')).toBe('fact');
    expect(resolveAnalyticalRole('D')).toBe('dimension');
  });

  it.each([
    'U', // jsonb, json, bytea, xml, uuid
    'G', // point and the geometric family
    'A', // arrays
    'C', // composite
    'R', // range
  ])(
    'refuses category %s, which the Table cannot render as a cell',
    (category) => {
      expect(resolveAnalyticalRole(category)).toBe('unsupported');
    },
  );

  it('still refuses uuid, which shares its category with jsonb', () => {
    // Widening the table to `I` and `T` was safe because each of those holds
    // only types we want. `U` is the opposite: `uuid` and `jsonb` are the same
    // category, so this assertion is what fails if someone admits it wholesale
    // to reach the uuid.
    expect(resolveAnalyticalRole('U')).toBe('unsupported');
  });

  it('defaults an unrecognised category to unsupported', () => {
    // The Gate 1 default that lets the `unsupported` list stay non-exhaustive:
    // a category invented by a future Postgres release is refused, not offered.
    expect(resolveAnalyticalRole('Ω')).toBe('unsupported');
  });
});
