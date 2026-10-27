import { describe, expect, it } from 'vite-plus/test';

import { buildForeignKeyRelationsQuery } from './build-foreign-key-relations-query.util.ts';

describe('buildForeignKeyRelationsQuery', () => {
  it('passes the base target and the depth as parameters', () => {
    expect(
      buildForeignKeyRelationsQuery({
        depth: 2,
        schema: 'catalog',
        table: 'items',
      }).values,
    ).toEqual(['catalog', 'items', 2]);
  });

  it('reads only foreign keys, with both column lists in constraint order', () => {
    const { text } = buildForeignKeyRelationsQuery({
      depth: 1,
      schema: 'catalog',
      table: 'items',
    });

    expect(text).toContain("con.contype = 'f'");
    expect(text).toContain('unnest(con.conkey) WITH ORDINALITY');
    expect(text).toContain('unnest(con.confkey) WITH ORDINALITY');
    expect(text).toContain('WHERE r.depth + 1 < $3');
  });
});
