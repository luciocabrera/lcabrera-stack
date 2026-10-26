import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type {
  BuiltGroupQuery,
  ColumnGroupingCapability,
  GroupQueryDescriptor,
} from '../group-query-builder/group-query-builder.types.ts';
import type {
  BuiltQuery,
  CountQueryDescriptor,
  SelectQueryDescriptor,
} from './query-builder.types.ts';

import { buildGroupedRead } from '../group-query-builder/build-grouped-read.util.ts';
import { buildCountRead } from './build-count-read.util.ts';
import { buildReadQuery } from './build-read-query.util.ts';
import { buildRowsRead } from './build-rows-read.util.ts';

const ALLOWED = ['id', 'region', 'status', 'amount'];

const dimension = (column: string): ColumnGroupingCapability => ({
  aggregates: ['count', 'countDistinct', 'max', 'min'],
  canGroup: true,
  column,
  distinctEstimate: 8,
  periods: [],
  role: 'dimension',
  typeName: 'text',
});

const CAPABILITIES: Readonly<Record<string, ColumnGroupingCapability>> = {
  amount: {
    aggregates: ['avg', 'count', 'countDistinct', 'max', 'min', 'sum'],
    canGroup: false,
    column: 'amount',
    periods: [],
    refusal: 'unique-ish',
    role: 'fact',
    typeName: 'numeric',
  },
  region: dimension('region'),
  status: dimension('status'),
};

const ROWS: SelectQueryDescriptor = {
  allowedColumns: ALLOWED,
  fields: ['id', 'region', 'amount'],
  filters: [{ column: 'status', operator: 'eq', value: 'open' }],
  limit: 25,
  offset: 50,
  schema: 'catalog',
  sort: [{ column: 'amount', direction: 'desc' }],
  table: 'items',
};

const COUNT: CountQueryDescriptor = {
  allowedColumns: ALLOWED,
  column: 'id',
  filters: [{ column: 'status', operator: 'eq', value: 'open' }],
  schema: 'catalog',
  table: 'items',
};

const GROUPED: GroupQueryDescriptor = {
  aggregates: [{ fn: 'count' }, { column: 'amount', fn: 'sum' }],
  allowedColumns: ALLOWED,
  capabilities: CAPABILITIES,
  filters: [{ column: 'status', operator: 'eq', value: 'open' }],
  grouping: 'rollup',
  keys: ['region', 'status'],
  maxRows: 5001,
  schema: 'catalog',
  sort: [{ aggregateAlias: 'sum_amount', direction: 'desc' }],
  table: 'items',
};

describe('buildReadQuery', () => {
  it('builds a filtered, sorted, paginated row read', () => {
    expect(buildReadQuery(ROWS)).toEqual({
      text:
        'SELECT "id", "region", "amount" FROM "catalog"."items" ' +
        'WHERE "status" = $1 ORDER BY "amount" DESC LIMIT $2 OFFSET $3',
      values: ['open', 25, 50],
    });
  });

  it('builds a distinct read from the same descriptor', () => {
    expect(
      buildReadQuery({ ...ROWS, distinct: true, fields: ['region'] }).text,
    ).toMatch(/^SELECT DISTINCT "region" FROM "catalog"\."items"/u);
  });

  it('resumes a row read after a keyset cursor', () => {
    const keyset: SelectQueryDescriptor = {
      allowedColumns: ALLOWED,
      cursor: { uniqueColumn: 'id', values: [10, 3] },
      fields: ['id', 'amount'],
      limit: 25,
      schema: 'catalog',
      sort: [
        { column: 'amount', direction: 'desc' },
        { column: 'id', direction: 'asc' },
      ],
      table: 'items',
    };

    expect(buildReadQuery(keyset)).toEqual(buildRowsRead(keyset));
    expect(buildReadQuery(keyset).text).toContain('"id" > $');
  });

  it('builds the count that pairs with a row read', () => {
    expect(buildReadQuery({ ...COUNT, count: true })).toEqual({
      text: 'SELECT count("id") AS count FROM "catalog"."items" WHERE "status" = $1',
      values: ['open'],
    });
  });

  it('builds a grouped, filtered, sorted, aggregated read in one call', () => {
    const built = buildReadQuery(GROUPED);

    expect(built.text).toContain('GROUP BY GROUPING SETS');
    expect(built.text).toContain('WHERE "status" = $1');
    expect(built.text).toContain('sum("amount")');
    expect(built.text).toContain('"sum_amount" DESC');
    expect(built.keys).toEqual(['region', 'status']);
    expect(built).toEqual(buildGroupedRead(GROUPED));
  });

  it('returns exactly what the shape-specific builder returns', () => {
    expect(buildReadQuery(ROWS)).toEqual(buildRowsRead(ROWS));
    expect(buildReadQuery({ ...COUNT, count: true })).toEqual(
      buildCountRead(COUNT),
    );
  });

  it('types a grouped read with its decode metadata and a row read without', () => {
    expectTypeOf(buildReadQuery(GROUPED)).toEqualTypeOf<BuiltGroupQuery>();
    expectTypeOf(buildReadQuery(ROWS)).toEqualTypeOf<BuiltQuery>();
    expectTypeOf(
      buildReadQuery({ ...COUNT, count: true }),
    ).toEqualTypeOf<BuiltQuery>();
  });

  describe('safety gates', () => {
    it('refuses an unsafe table on every shape', () => {
      expect(() => buildReadQuery({ ...ROWS, table: 'items; --' })).toThrow(
        'Unsafe identifier',
      );
      expect(() =>
        buildReadQuery({ ...COUNT, count: true, table: 'items; --' }),
      ).toThrow('Unsafe identifier');
      expect(() => buildReadQuery({ ...GROUPED, table: 'items; --' })).toThrow(
        'Unsafe identifier',
      );
    });

    it('refuses a column outside allowedColumns on every shape', () => {
      const message =
        'Column "secret" is not in the allowed list for this query.';

      expect(() => buildReadQuery({ ...ROWS, fields: ['secret'] })).toThrow(
        message,
      );
      expect(() =>
        buildReadQuery({
          ...ROWS,
          sort: [{ column: 'secret', direction: 'asc' }],
        }),
      ).toThrow(message);
      expect(() =>
        buildReadQuery({ ...COUNT, column: 'secret', count: true }),
      ).toThrow(message);
      expect(() =>
        buildReadQuery({
          ...GROUPED,
          filters: [{ column: 'secret', operator: 'eq', value: 1 }],
        }),
      ).toThrow(message);
    });

    it('refuses a group key the catalogue turned down', () => {
      expect(() => buildReadQuery({ ...GROUPED, keys: ['amount'] })).toThrow(
        'Column "amount" is not a legal group key: unique-ish.',
      );
    });
  });
});
