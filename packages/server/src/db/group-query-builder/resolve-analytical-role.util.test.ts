import { describe, expect, it } from 'vite-plus/test';

import { resolveAnalyticalRole } from './resolve-analytical-role.util.ts';

describe('resolveAnalyticalRole', () => {
  it.each([
    { category: 'S', role: 'dimension' }, // text, varchar, char, citext
    { category: 'B', role: 'dimension' }, // boolean
    { category: 'D', role: 'dimension' }, // date, timestamp, timestamptz
    { category: 'E', role: 'dimension' }, // enum
    { category: 'N', role: 'fact' }, // numeric, int2/4/8, float4/8, money
  ] as const)('reads category $category as $role', ({ category, role }) => {
    expect(resolveAnalyticalRole(category)).toBe(role);
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

  it('defaults an unrecognised category to unsupported', () => {
    // The Gate 1 default that lets the `unsupported` list stay non-exhaustive:
    // a category invented by a future Postgres release is refused, not offered.
    expect(resolveAnalyticalRole('Ω')).toBe('unsupported');
  });
});
