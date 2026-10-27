import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type {
  BuiltGroupQuery,
  ColumnGroupingCapability,
  GroupQueryDescriptor,
} from '../group-query-builder/group-query-builder.types.ts';
import type {
  BuiltQuery,
  CountQueryDescriptor,
  ForeignKeyRelation,
  ReadJoin,
  ReadQueryDescriptor,
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
    columns: ['country_code'],
    referencedColumns: ['code'],
    referencedSchema: 'ref',
    referencedTable: 'countries',
    schema: 'catalog',
    table: 'vendors',
  },
];

const VENDOR_JOIN: ReadJoin = {
  alias: 'vendor',
  allowedColumns: ['id', 'name', 'region', 'country_code'],
  foreignKey: ['vendor_id'],
  kind: 'inner',
};

const COUNTRY_JOIN: ReadJoin = {
  alias: 'country',
  allowedColumns: ['name'],
  foreignKey: ['country_code'],
  kind: 'left',
  source: 'vendor',
};

const JOINED_ALLOWED = ['id', 'vendor_id', 'status', 'amount', 'region'];

const JOINED_ROWS: SelectQueryDescriptor = {
  allowedColumns: JOINED_ALLOWED,
  fields: [
    'id',
    'amount',
    { column: 'name', source: 'vendor' },
    { column: 'name', source: 'country' },
  ],
  filters: [
    {
      column: { column: 'region', source: 'vendor' },
      operator: 'eq',
      value: 'north',
    },
    { column: 'status', operator: 'eq', value: 'open' },
  ],
  joins: [VENDOR_JOIN, COUNTRY_JOIN],
  limit: 25,
  relations: RELATIONS,
  schema: 'catalog',
  sort: [
    { column: { column: 'name', source: 'vendor' }, direction: 'asc' },
    { column: 'id', direction: 'asc' },
  ],
  table: 'items',
};

const JOINED_GROUPED: GroupQueryDescriptor = {
  aggregates: [{ fn: 'count' }, { column: 'amount', fn: 'sum' }],
  allowedColumns: JOINED_ALLOWED,
  capabilities: {
    ...CAPABILITIES,
    'vendor.region': dimension('region'),
  },
  grouping: 'flat',
  joins: [VENDOR_JOIN],
  keys: [{ column: 'region', source: 'vendor' }, 'status'],
  maxRows: 5001,
  relations: RELATIONS,
  schema: 'catalog',
  table: 'items',
};

const FLAT_GROUPED: GroupQueryDescriptor = {
  ...GROUPED,
  groupFilters: [
    { aggregateAlias: 'sum_amount', operator: 'gt', value: 1000 },
    { aggregateAlias: 'count_rows', operator: 'in', value: [2, 3] },
  ],
  grouping: 'flat',
  sort: [],
};

const withVendorAlias = (alias: string): SelectQueryDescriptor => ({
  ...JOINED_ROWS,
  fields: [{ column: 'name', source: alias }],
  filters: [],
  joins: [{ ...VENDOR_JOIN, alias }],
  sort: [],
});

const flatGroupedWith = (
  overrides: Partial<GroupQueryDescriptor>,
): GroupQueryDescriptor => ({ ...FLAT_GROUPED, ...overrides });

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

  it('refuses at the type level a field another shape owns', () => {
    const count = { ...COUNT, count: true as const };

    expectTypeOf(count).toExtend<ReadQueryDescriptor>();
    expectTypeOf({ ...count, limit: 10 }).not.toExtend<ReadQueryDescriptor>();
    expectTypeOf({
      ...count,
      sort: [{ column: 'id', direction: 'asc' as const }],
    }).not.toExtend<ReadQueryDescriptor>();
    expectTypeOf({
      ...count,
      keys: ['region'],
    }).not.toExtend<ReadQueryDescriptor>();
    expectTypeOf({
      ...ROWS,
      keys: ['region'],
    }).not.toExtend<ReadQueryDescriptor>();
    expectTypeOf({ ...ROWS, maxRows: 10 }).not.toExtend<ReadQueryDescriptor>();
    expectTypeOf({ ...ROWS, column: 'id' }).not.toExtend<ReadQueryDescriptor>();
    expectTypeOf({ ...GROUPED, limit: 10 }).not.toExtend<ReadQueryDescriptor>();
    expectTypeOf({
      ...GROUPED,
      column: 'id',
    }).not.toExtend<ReadQueryDescriptor>();
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

  describe('joins along a foreign key', () => {
    it('builds a row read over two chained joins, qualifying every column', () => {
      expect(buildReadQuery(JOINED_ROWS)).toEqual({
        text:
          'SELECT "items"."id", "items"."amount", "vendor"."name" AS "vendor.name", "country"."name" AS "country.name" ' +
          'FROM "catalog"."items" ' +
          'INNER JOIN "catalog"."vendors" AS "vendor" ON "items"."vendor_id" = "vendor"."id" ' +
          'LEFT JOIN "ref"."countries" AS "country" ON "vendor"."country_code" = "country"."code" ' +
          'WHERE "vendor"."region" = $1 AND "items"."status" = $2 ' +
          'ORDER BY "vendor"."name" ASC, "items"."id" ASC LIMIT $3',
        values: ['north', 'open', 25],
      });
    });

    it('builds the count over the same join', () => {
      expect(
        buildReadQuery({
          allowedColumns: JOINED_ALLOWED,
          column: { column: 'id', source: 'vendor' },
          count: true,
          filters: JOINED_ROWS.filters,
          joins: [VENDOR_JOIN],
          relations: RELATIONS,
          schema: 'catalog',
          table: 'items',
        }),
      ).toEqual({
        text:
          'SELECT count("vendor"."id") AS count FROM "catalog"."items" ' +
          'INNER JOIN "catalog"."vendors" AS "vendor" ON "items"."vendor_id" = "vendor"."id" ' +
          'WHERE "vendor"."region" = $1 AND "items"."status" = $2',
        values: ['north', 'open'],
      });
    });

    it('builds a grouped read keyed by a joined column', () => {
      const built = buildReadQuery(JOINED_GROUPED);

      expect(built.text).toBe(
        'SELECT "vendor"."region" AS "vendor.region", "items"."status", ' +
          'GROUPING("vendor"."region", "items"."status") AS "group_mask", ' +
          'count(*) AS "count_rows", sum("items"."amount") AS "sum_amount" ' +
          'FROM "catalog"."items" INNER JOIN "catalog"."vendors" AS "vendor" ON "items"."vendor_id" = "vendor"."id" ' +
          'GROUP BY GROUPING SETS (("vendor"."region", "items"."status")) ' +
          'ORDER BY "vendor.region" ASC, "status" ASC LIMIT $1',
      );
      expect(built.keys).toEqual(['vendor.region', 'status']);
    });

    it('lets a keyset sort name a joined column before the base unique column', () => {
      const built = buildReadQuery({
        ...JOINED_ROWS,
        cursor: { uniqueColumn: 'id', values: ['Acme', 7] },
      });

      expect(built.text).toContain(
        '("vendor"."name" IS NOT DISTINCT FROM $3 AND ("items"."id" > $4 OR "items"."id" IS NULL))',
      );
      expect(built.values).toEqual(['north', 'open', 'Acme', 7, 25]);
    });

    it('refuses a join without the base target allowedColumns', () => {
      expect(() =>
        buildReadQuery({ ...JOINED_ROWS, allowedColumns: undefined }),
      ).toThrow('A read with a join needs allowedColumns for its base target');
    });

    it('refuses a join without the relation map', () => {
      expect(() =>
        buildReadQuery({ ...JOINED_ROWS, relations: undefined }),
      ).toThrow('A read with a join needs the relation map');
    });

    it('refuses a join the relation map does not hold', () => {
      expect(() =>
        buildReadQuery({
          ...JOINED_ROWS,
          joins: [{ ...VENDOR_JOIN, foreignKey: ['region'] }],
        }),
      ).toThrow('Join "vendor" follows no declared foreign key');
    });

    it.each(['right', 'full', 'cross'])('refuses a %s join', (kind) => {
      const joins: readonly ReadJoin[] = JSON.parse(
        `[{"alias":"vendor","allowedColumns":["name"],"foreignKey":["vendor_id"],"kind":"${kind}"}]`,
      );

      expect(() => buildReadQuery({ ...JOINED_ROWS, joins })).toThrow(
        `has kind "${kind}"; only inner and left joins are offered`,
      );
    });

    it('checks every column against its own source, never another one', () => {
      expect(() =>
        buildReadQuery({
          ...JOINED_ROWS,
          fields: [{ column: 'amount', source: 'vendor' }],
        }),
      ).toThrow('Column "amount" is not in the allowed list for this query.');
      expect(() =>
        buildReadQuery({ ...JOINED_ROWS, fields: ['name'] }),
      ).toThrow('Column "name" is not in the allowed list for this query.');
    });

    it('refuses a joined column outside its join list on every shape', () => {
      const secret = { column: 'secret', source: 'vendor' };
      const message =
        'Column "secret" is not in the allowed list for this query.';

      expect(() =>
        buildReadQuery({
          ...JOINED_ROWS,
          filters: [{ column: secret, operator: 'eq', value: 1 }],
        }),
      ).toThrow(message);
      expect(() =>
        buildReadQuery({
          ...JOINED_ROWS,
          sort: [{ column: secret, direction: 'asc' }],
        }),
      ).toThrow(message);
      expect(() =>
        buildReadQuery({
          allowedColumns: JOINED_ALLOWED,
          column: secret,
          count: true,
          joins: [VENDOR_JOIN],
          relations: RELATIONS,
          schema: 'catalog',
          table: 'items',
        }),
      ).toThrow(message);
      expect(() =>
        buildReadQuery({ ...JOINED_GROUPED, keys: [secret] }),
      ).toThrow(message);
      expect(() =>
        buildReadQuery({
          ...JOINED_GROUPED,
          aggregates: [{ column: secret, fn: 'max' as const }],
        }),
      ).toThrow(message);
    });

    it('refuses a column naming a source the read does not join', () => {
      expect(() =>
        buildReadQuery({
          ...ROWS,
          fields: [{ column: 'name', source: 'vendor' }],
        }),
      ).toThrow('names the source "vendor", but this read has no join');
      expect(() =>
        buildReadQuery({
          ...JOINED_ROWS,
          fields: [{ column: 'name', source: 'buyer' }],
        }),
      ).toThrow(
        `names the source "buyer", which is not one of this read's joins`,
      );
    });

    it('refuses a dotted string in place of a joined column reference', () => {
      expect(() =>
        buildReadQuery({ ...JOINED_ROWS, fields: ['vendor.name'] }),
      ).toThrow('Unsafe identifier: "vendor.name"');
    });

    it('refuses a keyset cursor whose unique column is a joined column', () => {
      const cursor = JSON.parse(
        '{"uniqueColumn":{"column":"id","source":"vendor"},"values":["Acme",7]}',
      );

      expect(() =>
        buildReadQuery({
          ...JOINED_ROWS,
          cursor,
          sort: [
            { column: { column: 'name', source: 'vendor' }, direction: 'asc' },
            { column: { column: 'id', source: 'vendor' }, direction: 'asc' },
          ],
        }),
      ).toThrow('a cursor rests on a base-target column');
    });

    it('refuses a keyset cursor over a sort that ends on a joined column', () => {
      expect(() =>
        buildReadQuery({
          ...JOINED_ROWS,
          cursor: { uniqueColumn: 'id', values: [7, 'Acme'] },
          sort: [
            { column: 'id', direction: 'asc' },
            { column: { column: 'name', source: 'vendor' }, direction: 'asc' },
          ],
        }),
      ).toThrow('but it ends on "vendor.name"');
    });

    it('refuses a projected alias past 63 bytes, naming it, and accepts one at 63', () => {
      const atLimit = 'v'.repeat(58);
      const pastLimit = 'v'.repeat(59);
      expect(buildReadQuery(withVendorAlias(atLimit)).text).toContain(
        `AS "${atLimit}.name"`,
      );
      expect(() => buildReadQuery(withVendorAlias(pastLimit))).toThrow(
        `The projected alias "${pastLimit}.name" is longer than Postgres's 63-byte identifier limit`,
      );
    });

    it('refuses a joined group key whose projected alias passes 63 bytes', () => {
      const alias = 'v'.repeat(57);

      expect(() =>
        buildReadQuery({
          ...JOINED_GROUPED,
          capabilities: {
            ...JOINED_GROUPED.capabilities,
            [`${alias}.region`]: dimension('region'),
          },
          joins: [{ ...VENDOR_JOIN, alias }],
          keys: [{ column: 'region', source: alias }],
        }),
      ).toThrow(`The projected alias "${alias}.region" is longer`);
    });
  });

  describe('a filter on a grouped result', () => {
    it('emits HAVING from each aggregate expression, parameterizing the value', () => {
      const built = buildReadQuery(FLAT_GROUPED);

      expect(built.text).toBe(
        'SELECT "region", "status", GROUPING("region", "status") AS "group_mask", ' +
          'count(*) AS "count_rows", sum("amount") AS "sum_amount" ' +
          'FROM "catalog"."items" WHERE "status" = $1 ' +
          'GROUP BY GROUPING SETS (("region", "status")) ' +
          'HAVING sum("amount") > $2 AND count(*) IN ($3, $4) ' +
          'ORDER BY "region" ASC, "status" ASC LIMIT $5',
      );
      expect(built.values).toEqual(['open', 1000, 2, 3, 5001]);
    });

    it('writes an aggregate FILTER into HAVING again, reusing its parameter', () => {
      const built = buildReadQuery(
        flatGroupedWith({
          aggregates: [
            { fn: 'count' },
            {
              alias: 'north_amount',
              column: 'amount',
              filters: [{ column: 'region', operator: 'eq', value: 'north' }],
              fn: 'sum',
            },
          ],
          groupFilters: [
            { aggregateAlias: 'north_amount', operator: 'isNotNull' },
          ],
        }),
      );

      expect(built.text).toContain(
        'HAVING sum("amount") FILTER (WHERE "region" = $1) IS NOT NULL',
      );
      expect(built.values).toEqual(['north', 'open', 5001]);
    });

    it.each(['rollup', 'cube'] as const)(
      'refuses a group filter with %s',
      (grouping) => {
        expect(() => buildReadQuery({ ...FLAT_GROUPED, grouping })).toThrow(
          `A group filter is refused with grouping "${grouping}"`,
        );
      },
    );

    it.each(['sum_amount', 'count_rows'])(
      'refuses a group filter on %s when the read has a column axis',
      (aggregateAlias) => {
        expect(() =>
          buildReadQuery(
            flatGroupedWith({
              columnAxis: { key: 'region', maxDistinct: 10, values: ['north'] },
              groupFilters: [{ aggregateAlias, operator: 'gt', value: 1 }],
              keys: ['status'],
            }),
          ),
        ).toThrow('A group filter is refused on a read with a column axis');
      },
    );

    it('refuses a group filter naming no declared aggregate', () => {
      expect(() =>
        buildReadQuery(
          flatGroupedWith({
            groupFilters: [
              { aggregateAlias: 'avg_amount', operator: 'gt', value: 1 },
            ],
          }),
        ),
      ).toThrow(
        `Cannot filter groups by "avg_amount": it is not one of this query's aggregates.`,
      );
    });

    it.each(['ilike', 'notIlike'])(
      'refuses the %s operator on an aggregate',
      (operator) => {
        const groupFilters = JSON.parse(
          `[{"aggregateAlias":"sum_amount","operator":"${operator}","value":"x"}]`,
        );

        expect(() => buildReadQuery({ ...FLAT_GROUPED, groupFilters })).toThrow(
          `Cannot filter groups by "sum_amount" with "${operator}"`,
        );
      },
    );

    it('refuses a group filter at the type level on a row or count read', () => {
      expectTypeOf({
        ...ROWS,
        groupFilters: [],
      }).not.toExtend<ReadQueryDescriptor>();
      expectTypeOf({
        ...COUNT,
        count: true as const,
        groupFilters: [],
      }).not.toExtend<ReadQueryDescriptor>();
    });
  });
});
