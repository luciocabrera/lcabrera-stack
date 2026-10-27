import { describe, expect, it } from 'vite-plus/test';

import type {
  ForeignKeyRelation,
  ReadJoin,
  ReadScopeSource,
} from './query-builder.types.ts';

import { resolveJoinRelation } from './resolve-join-relation.util.ts';

const SOURCE: ReadScopeSource = {
  allowedColumns: ['id', 'region_code', 'region_year', 'buyer_id'],
  qualifier: 'items',
  schema: 'catalog',
  table: 'items',
};

const COMPOSITE: ForeignKeyRelation = {
  columns: ['region_code', 'region_year'],
  referencedColumns: ['code', 'year'],
  referencedSchema: 'catalog',
  referencedTable: 'regions',
  schema: 'catalog',
  table: 'items',
};

const JOIN: ReadJoin = {
  alias: 'region',
  allowedColumns: ['name'],
  foreignKey: ['region_year', 'region_code'],
  kind: 'inner',
};

describe('resolveJoinRelation', () => {
  it('matches a foreign key by its column set, in any order', () => {
    expect(
      resolveJoinRelation({
        join: JOIN,
        relations: [COMPOSITE],
        source: SOURCE,
      }),
    ).toBe(COMPOSITE);
  });

  it('does not match a foreign key declared on another table', () => {
    expect(() =>
      resolveJoinRelation({
        join: JOIN,
        relations: [{ ...COMPOSITE, table: 'orders' }],
        source: SOURCE,
      }),
    ).toThrow(
      'Join "region" follows no declared foreign key: "catalog"."items" has none on (region_year, region_code).',
    );
  });

  it('does not match a foreign key over a subset of the named columns', () => {
    expect(() =>
      resolveJoinRelation({
        join: JOIN,
        relations: [
          {
            ...COMPOSITE,
            columns: ['region_code'],
            referencedColumns: ['code'],
          },
        ],
        source: SOURCE,
      }),
    ).toThrow('follows no declared foreign key');
  });

  it('refuses two foreign keys over the same columns as ambiguous', () => {
    expect(() =>
      resolveJoinRelation({
        join: JOIN,
        relations: [COMPOSITE, { ...COMPOSITE, referencedTable: 'zones' }],
        source: SOURCE,
      }),
    ).toThrow('Join "region" is ambiguous: 2 foreign keys');
  });

  it('refuses a join named by no column', () => {
    expect(() =>
      resolveJoinRelation({
        join: { ...JOIN, foreignKey: [] },
        relations: [COMPOSITE],
        source: SOURCE,
      }),
    ).toThrow('Join "region" names no foreign-key column');
  });

  it('checks the foreign-key columns against the source list', () => {
    expect(() =>
      resolveJoinRelation({
        join: { ...JOIN, foreignKey: ['owner_id'] },
        relations: [COMPOSITE],
        source: SOURCE,
      }),
    ).toThrow('Column "owner_id" is not in the allowed list for this query.');
    expect(() =>
      resolveJoinRelation({
        join: { ...JOIN, foreignKey: ['owner id'] },
        relations: [COMPOSITE],
        source: SOURCE,
      }),
    ).toThrow('Unsafe identifier: "owner id"');
  });

  it('refuses a relation whose column pairs do not line up', () => {
    expect(() =>
      resolveJoinRelation({
        join: JOIN,
        relations: [{ ...COMPOSITE, referencedColumns: ['code'] }],
        source: SOURCE,
      }),
    ).toThrow('pairs 2 column(s) with 1 referenced column(s)');
  });

  it('refuses a relation naming an unsafe target', () => {
    expect(() =>
      resolveJoinRelation({
        join: JOIN,
        relations: [{ ...COMPOSITE, referencedTable: 'regions"; --' }],
        source: SOURCE,
      }),
    ).toThrow('Unsafe identifier');
    expect(() =>
      resolveJoinRelation({
        join: JOIN,
        relations: [{ ...COMPOSITE, referencedColumns: ['code', 'Year'] }],
        source: SOURCE,
      }),
    ).toThrow('Unsafe identifier: "Year"');
  });
});
