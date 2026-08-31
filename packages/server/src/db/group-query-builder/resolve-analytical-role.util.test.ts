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
      expect(
        resolveAnalyticalRole({
          typeCategory: category,
          typeName,
          typeNamespace: 'pg_catalog',
        }),
      ).toBe(role);
    },
  );

  it('reads interval as a fact rather than a date-like dimension', () => {
    expect(
      resolveAnalyticalRole({
        typeCategory: 'T',
        typeName: 'interval',
        typeNamespace: 'pg_catalog',
      }),
    ).toBe('fact');
    expect(
      resolveAnalyticalRole({
        typeCategory: 'D',
        typeName: 'date',
        typeNamespace: 'pg_catalog',
      }),
    ).toBe('dimension');
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
      expect(
        resolveAnalyticalRole({
          typeCategory: category,
          typeName,
          typeNamespace: 'pg_catalog',
        }),
      ).toBe('unsupported');
    },
  );

  it('admits uuid by name while its category stays refused', () => {
    expect(
      resolveAnalyticalRole({
        typeCategory: 'U',
        typeName: 'uuid',
        typeNamespace: 'pg_catalog',
      }),
    ).toBe('dimension');
    expect(
      resolveAnalyticalRole({
        typeCategory: 'U',
        typeName: 'jsonb',
        typeNamespace: 'pg_catalog',
      }),
    ).toBe('unsupported');
  });

  it('refuses a uuid-named type from another schema', () => {
    expect(
      resolveAnalyticalRole({
        typeCategory: 'C',
        typeName: 'uuid',
        typeNamespace: 'app',
      }),
    ).toBe('unsupported');
  });

  it('admits a uuid whatever category a future Postgres files it under', () => {
    expect(
      resolveAnalyticalRole({
        typeCategory: 'Z',
        typeName: 'uuid',
        typeNamespace: 'pg_catalog',
      }),
    ).toBe('dimension');
  });

  it('defaults an unrecognised category to unsupported', () => {
    expect(
      resolveAnalyticalRole({
        typeCategory: 'Ω',
        typeName: 'whatever',
        typeNamespace: 'pg_catalog',
      }),
    ).toBe('unsupported');
  });
});
