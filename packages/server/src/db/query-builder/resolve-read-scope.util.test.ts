import { describe, expect, it } from 'vite-plus/test';

import type { ForeignKeyRelation, ReadJoin } from './query-builder.types.ts';

import { resolveReadScope } from './resolve-read-scope.util.ts';

const RELATIONS: readonly ForeignKeyRelation[] = [
  {
    columns: ['vendor_id'],
    referencedColumns: ['id'],
    referencedSchema: 'catalog',
    referencedTable: 'vendors',
    schema: 'catalog',
    table: 'items',
  },
  {
    columns: ['parent_id'],
    referencedColumns: ['id'],
    referencedSchema: 'catalog',
    referencedTable: 'vendors',
    schema: 'catalog',
    table: 'vendors',
  },
];

const VENDOR: ReadJoin = {
  alias: 'vendor',
  allowedColumns: ['id', 'name', 'parent_id'],
  foreignKey: ['vendor_id'],
  kind: 'inner',
};

const BASE = {
  allowedColumns: ['id', 'vendor_id'],
  relations: RELATIONS,
  schema: 'catalog',
  table: 'items',
};

describe('resolveReadScope', () => {
  it('resolves no scope for a single-target read', () => {
    expect(resolveReadScope(BASE)).toBeUndefined();
    expect(resolveReadScope({ ...BASE, joins: [] })).toBeUndefined();
  });

  it('builds the FROM list and one source per join', () => {
    const scope = resolveReadScope({
      ...BASE,
      joins: [
        VENDOR,
        {
          alias: 'parent',
          allowedColumns: ['name'],
          foreignKey: ['parent_id'],
          kind: 'left',
          source: 'vendor',
        },
      ],
    });

    expect(scope?.from).toBe(
      '"catalog"."items" ' +
        'INNER JOIN "catalog"."vendors" AS "vendor" ON "items"."vendor_id" = "vendor"."id" ' +
        'LEFT JOIN "catalog"."vendors" AS "parent" ON "vendor"."parent_id" = "parent"."id"',
    );
    expect(scope?.base).toEqual({
      allowedColumns: ['id', 'vendor_id'],
      qualifier: 'items',
      schema: 'catalog',
      table: 'items',
    });
    expect(scope?.joins.get('parent')).toEqual({
      allowedColumns: ['name'],
      qualifier: 'parent',
      schema: 'catalog',
      table: 'vendors',
    });
  });

  it('refuses a join without the base allowedColumns', () => {
    expect(() =>
      resolveReadScope({ ...BASE, allowedColumns: undefined, joins: [VENDOR] }),
    ).toThrow('A read with a join needs allowedColumns for its base target');
  });

  it('refuses a join without the relation map', () => {
    expect(() =>
      resolveReadScope({ ...BASE, joins: [VENDOR], relations: undefined }),
    ).toThrow('A read with a join needs the relation map');
  });

  it('refuses an unsafe alias', () => {
    expect(() =>
      resolveReadScope({ ...BASE, joins: [{ ...VENDOR, alias: 'v; --' }] }),
    ).toThrow('Unsafe identifier: "v; --"');
  });

  it('refuses an alias the base target or an earlier join holds', () => {
    expect(() =>
      resolveReadScope({ ...BASE, joins: [{ ...VENDOR, alias: 'items' }] }),
    ).toThrow('Join alias "items" is already taken');
    expect(() =>
      resolveReadScope({
        ...BASE,
        joins: [
          VENDOR,
          { ...VENDOR, foreignKey: ['parent_id'], source: 'vendor' },
        ],
      }),
    ).toThrow('Join alias "vendor" is already taken');
  });

  it.each(['right', 'full', 'cross'])('refuses a %s join', (kind) => {
    const joins: readonly ReadJoin[] = JSON.parse(
      `[{"alias":"vendor","allowedColumns":["id"],"foreignKey":["vendor_id"],"kind":"${kind}"}]`,
    );

    expect(() => resolveReadScope({ ...BASE, joins })).toThrow(
      `Join "vendor" has kind "${kind}"`,
    );
  });

  it('refuses a join that carries no allowedColumns of its own', () => {
    const joins: readonly ReadJoin[] = JSON.parse(
      '[{"alias":"vendor","foreignKey":["vendor_id"],"kind":"inner"}]',
    );

    expect(() => resolveReadScope({ ...BASE, joins })).toThrow(
      'Join "vendor" needs its own allowedColumns',
    );
  });

  it('refuses a join that starts from a source the read has not reached', () => {
    expect(() =>
      resolveReadScope({ ...BASE, joins: [{ ...VENDOR, source: 'buyer' }] }),
    ).toThrow('Join "vendor" starts from "buyer"');
  });
});
