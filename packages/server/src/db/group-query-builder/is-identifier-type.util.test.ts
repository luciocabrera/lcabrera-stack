import { describe, expect, it } from 'vite-plus/test';

import { isIdentifierType } from './is-identifier-type.util.ts';

describe('isIdentifierType', () => {
  it('recognises the built-in uuid', () => {
    expect(
      isIdentifierType({ typeName: 'uuid', typeNamespace: 'pg_catalog' }),
    ).toBe(true);
  });

  it('refuses a same-named type from another schema', () => {
    // The reason matching is schema-qualified. `CREATE TYPE app.uuid AS (a int,
    // b int)` is a composite reporting `typname = 'uuid'`, and a bare-name match
    // would admit it as a dimension — a type the Table cannot render, which is
    // precisely what Gate 1 exists to refuse.
    expect(isIdentifierType({ typeName: 'uuid', typeNamespace: 'app' })).toBe(
      false,
    );
  });

  it('refuses an ordinary type', () => {
    expect(
      isIdentifierType({ typeName: 'text', typeNamespace: 'pg_catalog' }),
    ).toBe(false);
  });

  it('refuses the jsonb that shares uuid’s category', () => {
    expect(
      isIdentifierType({ typeName: 'jsonb', typeNamespace: 'pg_catalog' }),
    ).toBe(false);
  });
});
