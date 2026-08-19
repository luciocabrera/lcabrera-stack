/**
 * The expected SQL below is the plan document's worked examples over
 * `public.enterprise_orders`, kept as literal text rather than a snapshot file
 * so a diff shows the query a reviewer would have to read anyway.
 */
import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnGroupingCapability,
  GroupQueryDescriptor,
} from './group-query-builder.types.ts';

import { buildGroupQuery } from './build-group-query.util.ts';

const ALLOWED = [
  'order_status',
  'shipping_country',
  'city',
  'priority',
  'total_amount',
  'order_date',
  'is_gift',
  'doc',
];

const dimension = (column: string): ColumnGroupingCapability => ({
  aggregates: ['count', 'countDistinct', 'max', 'min'],
  canGroup: true,
  column,
  distinctEstimate: 12,
  periods: [],
  role: 'dimension',
  typeName: 'text',
});

const CAPABILITIES: Readonly<Record<string, ColumnGroupingCapability>> = {
  city: dimension('city'),
  doc: {
    aggregates: ['count'],
    canGroup: false,
    column: 'doc',
    periods: [],
    refusal: 'not-a-dimension',
    role: 'unsupported',
    typeName: 'jsonb',
  },
  is_gift: {
    aggregates: ['boolAnd', 'boolOr', 'count', 'countDistinct'],
    canGroup: true,
    column: 'is_gift',
    periods: [],
    role: 'dimension',
    typeName: 'bool',
  },
  order_date: {
    aggregates: ['count', 'countDistinct', 'max', 'min'],
    canGroup: false,
    column: 'order_date',
    periods: [],
    refusal: 'unique-ish',
    role: 'dimension',
    typeName: 'date',
  },
  order_status: dimension('order_status'),
  priority: dimension('priority'),
  shipping_country: dimension('shipping_country'),
  total_amount: {
    aggregates: ['avg', 'count', 'countDistinct', 'max', 'min', 'sum'],
    canGroup: false,
    column: 'total_amount',
    periods: [],
    refusal: 'unique-ish',
    role: 'fact',
    typeName: 'numeric',
  },
};

const descriptor = (
  overrides: Partial<GroupQueryDescriptor> = {},
): GroupQueryDescriptor => ({
  aggregates: [{ fn: 'count' }, { column: 'total_amount', fn: 'sum' }],
  allowedColumns: ALLOWED,
  capabilities: CAPABILITIES,
  grouping: 'flat',
  keys: ['order_status', 'shipping_country'],
  maxRows: 5001,
  schema: 'public',
  table: 'enterprise_orders',
  ...overrides,
});

/** The `ORDER BY` tail, so two modes' ordering can be compared as one string. */
const orderByOf = (text: string) => text.slice(text.indexOf('ORDER BY'));

/**
 * The `GROUP BY` clause alone. The scoping is load-bearing: against the whole
 * statement a set like `("shipping_country")` also matches the `ORDER BY`'s
 * `GROUPING("shipping_country")` term, which every mode emits — so the same
 * probe run over `text` reports a cube and a rollup as identical.
 */
const groupByOf = (text: string) =>
  text.slice(text.indexOf('GROUP BY'), text.indexOf('ORDER BY'));

const SELECT_LIST =
  'SELECT "order_status", "shipping_country", ' +
  'GROUPING("order_status", "shipping_country") AS "group_mask", ' +
  'count(*) AS "count_rows", sum("total_amount") AS "sum_total_amount" ' +
  'FROM "public"."enterprise_orders"';

describe('buildGroupQuery', () => {
  it('emits a flat grouping with no GROUPING terms in the ORDER BY', () => {
    const result = buildGroupQuery(
      descriptor({
        filters: [
          { column: 'order_date', operator: 'gte', value: '2026-01-01' },
          { column: 'is_gift', operator: 'eq', value: false },
        ],
      }),
    );

    expect(result.text).toBe(
      `${SELECT_LIST} ` +
        'WHERE "order_date" >= $1 AND "is_gift" = $2 ' +
        'GROUP BY GROUPING SETS (("order_status", "shipping_country")) ' +
        'ORDER BY "order_status" ASC, "shipping_country" ASC ' +
        'LIMIT $3',
    );
    expect(result.values).toEqual(['2026-01-01', false, 5001]);
    expect(result.groupingSetMasks).toEqual([0]);
  });

  it('emits a rollup as its explicit sets, led by the GROUPING terms', () => {
    const result = buildGroupQuery(
      descriptor({
        filters: [
          { column: 'order_date', operator: 'gte', value: '2026-01-01' },
          { column: 'is_gift', operator: 'eq', value: false },
        ],
        grouping: 'rollup',
      }),
    );

    expect(result.text).toBe(
      `${SELECT_LIST} ` +
        'WHERE "order_date" >= $1 AND "is_gift" = $2 ' +
        'GROUP BY GROUPING SETS (("order_status", "shipping_country"), ("order_status"), ()) ' +
        'ORDER BY GROUPING("order_status") ASC, "order_status" ASC, ' +
        'GROUPING("shipping_country") ASC, "shipping_country" ASC ' +
        'LIMIT $3',
    );
    expect(result.groupingSetMasks).toEqual([0, 1, 3]);
  });

  it('emits a cube as every subset, in ascending mask order', () => {
    const result = buildGroupQuery(descriptor({ grouping: 'cube' }));

    expect(result.text).toContain(
      'GROUP BY GROUPING SETS ' +
        '(("order_status", "shipping_country"), ("order_status"), ("shipping_country"), ())',
    );
    expect(result.groupingSetMasks).toEqual([0, 1, 2, 3]);
  });

  it('gives a cube the same ORDER BY shape a rollup gets', () => {
    // Ordering is driven by "is this key rolled up in some set", not by the
    // mode, so cube must reach byte-identical terms — it rolls up every key.
    const cube = buildGroupQuery(descriptor({ grouping: 'cube' }));
    const rollup = buildGroupQuery(descriptor({ grouping: 'rollup' }));

    expect(orderByOf(cube.text)).toBe(orderByOf(rollup.text));
  });

  it('emits the cross-cutting set a rollup never does', () => {
    // The one output difference that identifies the mode from the SQL alone:
    // `("shipping_country")` totals across every status, so it is a child of no
    // status row. Compared over the GROUP BY clause only — see `groupByOf`.
    const cube = buildGroupQuery(descriptor({ grouping: 'cube' }));
    const rollup = buildGroupQuery(descriptor({ grouping: 'rollup' }));

    expect(groupByOf(cube.text)).toContain('("shipping_country")');
    expect(groupByOf(rollup.text)).not.toContain('("shipping_country")');
  });

  it('refuses a cube past its own depth cap, one key before a rollup', () => {
    const keys = ['order_status', 'shipping_country', 'city', 'priority'];

    expect(() =>
      buildGroupQuery(descriptor({ grouping: 'cube', keys })),
    ).toThrow('A cube grouping takes at most 3 group keys; got 4.');
    expect(() =>
      buildGroupQuery(descriptor({ grouping: 'rollup', keys })),
    ).not.toThrow();
  });

  it('ships the keys and masks the caller needs to decode the mask column', () => {
    const result = buildGroupQuery(descriptor({ grouping: 'rollup' }));

    expect(result.keys).toEqual(['order_status', 'shipping_country']);
    expect(result.maskAlias).toBe('group_mask');
    expect(result.aggregates).toEqual([
      { alias: 'count_rows', fn: 'count' },
      { alias: 'sum_total_amount', column: 'total_amount', fn: 'sum' },
    ]);
  });

  it.each([1, 2, 3, 4])('emits a flat grouping at depth %i', (depth) => {
    const keys = ['order_status', 'shipping_country', 'city', 'priority'].slice(
      0,
      depth,
    );
    const result = buildGroupQuery(descriptor({ keys }));
    const quoted = keys.map((key) => `"${key}"`).join(', ');

    expect(result.text).toContain(`GROUP BY GROUPING SETS ((${quoted}))`);
    expect(result.text).toContain(`GROUPING(${quoted}) AS "group_mask"`);
    expect(result.groupingSetMasks).toEqual([0]);
  });

  it.each([
    { fn: 'avg', projection: 'avg("total_amount") AS "avg_total_amount"' },
    {
      fn: 'count',
      projection: 'count("total_amount") AS "count_total_amount"',
    },
    {
      fn: 'countDistinct',
      projection:
        'count(DISTINCT "total_amount") AS "count_distinct_total_amount"',
    },
    { fn: 'max', projection: 'max("total_amount") AS "max_total_amount"' },
    { fn: 'min', projection: 'min("total_amount") AS "min_total_amount"' },
    { fn: 'sum', projection: 'sum("total_amount") AS "sum_total_amount"' },
  ] as const)('projects $fn', ({ fn, projection }) => {
    const result = buildGroupQuery(
      descriptor({ aggregates: [{ column: 'total_amount', fn }] }),
    );

    expect(result.text).toContain(projection);
  });

  it.each([
    { fn: 'boolAnd', projection: 'bool_and("is_gift") AS "bool_and_is_gift"' },
    { fn: 'boolOr', projection: 'bool_or("is_gift") AS "bool_or_is_gift"' },
  ] as const)(
    'projects $fn on the boolean that supports it',
    ({ fn, projection }) => {
      const result = buildGroupQuery(
        descriptor({ aggregates: [{ column: 'is_gift', fn }] }),
      );

      expect(result.text).toContain(projection);
    },
  );

  it('shifts the WHERE clause when a FILTER aggregate claims the leading parameters', () => {
    // The values array is the assertion that matters. Checking only the text
    // would pass with the values in the wrong order, which is the actual bug
    // this ordering can cause.
    const result = buildGroupQuery(
      descriptor({
        aggregates: [
          { fn: 'count' },
          {
            alias: 'count_rows_urgent',
            filters: [{ column: 'priority', operator: 'eq', value: 'Urgent' }],
            fn: 'count',
          },
        ],
        filters: [
          { column: 'order_date', operator: 'gte', value: '2026-01-01' },
          { column: 'is_gift', operator: 'eq', value: false },
        ],
      }),
    );

    expect(result.text).toContain(
      'count(*) FILTER (WHERE "priority" = $1) AS "count_rows_urgent"',
    );
    expect(result.text).toContain(
      'WHERE "order_date" >= $2 AND "is_gift" = $3',
    );
    expect(result.text).toContain('LIMIT $4');
    expect(result.values).toEqual(['Urgent', '2026-01-01', false, 5001]);
  });

  it('quotes the schema and table', () => {
    expect(buildGroupQuery(descriptor()).text).toContain(
      'FROM "public"."enterprise_orders"',
    );
  });

  it('refuses an unsafe schema or table', () => {
    expect(() =>
      buildGroupQuery(descriptor({ schema: 'public; DROP SCHEMA cqms' })),
    ).toThrow('Unsafe identifier');
    expect(() => buildGroupQuery(descriptor({ table: 'Orders' }))).toThrow(
      'Unsafe identifier',
    );
  });

  it('refuses more keys than the depth cap', () => {
    expect(() =>
      buildGroupQuery(
        descriptor({
          keys: [
            'order_status',
            'shipping_country',
            'city',
            'priority',
            'is_gift',
          ],
        }),
      ),
    ).toThrow('at most 4 group keys');
  });

  it('refuses a key outside the allowlist', () => {
    expect(() =>
      buildGroupQuery(
        descriptor({
          capabilities: { ...CAPABILITIES, region: dimension('region') },
          keys: ['region'],
        }),
      ),
    ).toThrow('not in the allowed list');
  });

  it('refuses an uppercase key', () => {
    expect(() =>
      buildGroupQuery(
        descriptor({
          allowedColumns: [...ALLOWED, 'Order_Status'],
          capabilities: {
            ...CAPABILITIES,
            Order_Status: dimension('Order_Status'),
          },
          keys: ['Order_Status'],
        }),
      ),
    ).toThrow('Unsafe identifier');
  });

  it('refuses a type-illegal aggregate', () => {
    expect(() =>
      buildGroupQuery(
        descriptor({ aggregates: [{ column: 'doc', fn: 'min' }] }),
      ),
    ).toThrow('not legal for column "doc"');
  });

  it('refuses grouping by a column the catalogue turned down', () => {
    expect(() => buildGroupQuery(descriptor({ keys: ['doc'] }))).toThrow(
      'not-a-dimension',
    );
    expect(() => buildGroupQuery(descriptor({ keys: ['order_date'] }))).toThrow(
      'unique-ish',
    );
  });

  it('refuses a fixed alias that collides with a real column', () => {
    expect(() =>
      buildGroupQuery(
        descriptor({ allowedColumns: [...ALLOWED, 'group_mask'] }),
      ),
    ).toThrow('collides with a real column');
  });

  it('refuses two aggregates that would land on the same alias', () => {
    expect(() =>
      buildGroupQuery(
        descriptor({
          aggregates: [
            { column: 'total_amount', fn: 'sum' },
            { alias: 'sum_total_amount', column: 'total_amount', fn: 'avg' },
          ],
        }),
      ),
    ).toThrow('projected more than once');
  });

  it('refuses an alias past the identifier limit', () => {
    expect(() =>
      buildGroupQuery(
        descriptor({
          aggregates: [
            { alias: 'a'.repeat(64), column: 'total_amount', fn: 'sum' },
          ],
        }),
      ),
    ).toThrow('identifier limit');
  });

  it('places subtotals first when asked', () => {
    const result = buildGroupQuery(
      descriptor({ grouping: 'rollup', subtotalPlacement: 'first' }),
    );

    expect(result.text).toContain('ORDER BY GROUPING("order_status") DESC');
  });

  it('sorts leaves by an aggregate without disturbing the tree', () => {
    const result = buildGroupQuery(
      descriptor({
        grouping: 'rollup',
        sort: [{ aggregateAlias: 'sum_total_amount', direction: 'desc' }],
      }),
    );

    expect(result.text).toContain(
      'GROUPING("shipping_country") ASC, "sum_total_amount" DESC, "shipping_country" ASC',
    );
  });

  it('refuses an aggregate sort that would rank an ancestor', () => {
    expect(() =>
      buildGroupQuery(
        descriptor({
          grouping: 'rollup',
          sort: [
            { aggregateAlias: 'sum_total_amount', direction: 'desc' },
            { direction: 'asc', key: 'order_status' },
          ],
        }),
      ),
    ).toThrow('never rank an ancestor');
  });

  it('carries the pre-flight bound it emitted the LIMIT from', () => {
    const result = buildGroupQuery(descriptor());

    // 12 x 12 for the two keys. Emitted rather than left to the caller, so the
    // number in the SQL and the number the caller reasons about are the same.
    expect(result.guardRails).toEqual({
      estimate: { kind: 'known', rows: 144 },
      rowLimit: { limit: 5001 },
    });
  });

  it('caps the LIMIT at the backstop when a key has no statistics', () => {
    const result = buildGroupQuery(
      descriptor({ keys: ['is_gift'], maxRows: 20_000 }),
    );

    // The caller asked for 20 000; `is_gift` carries no estimate, so the read
    // runs under the guard's own ceiling instead and reaching it is a refusal.
    expect(result.guardRails.rowLimit).toEqual({
      backstopAt: 5001,
      limit: 5001,
    });
    expect(result.values.at(-1)).toBe(5001);
    expect(result.guardRails.warning).toEqual({
      columns: ['is_gift'],
      kind: 'stats-unavailable',
    });
  });

  it('refuses a grouping whose bound is past the ceiling, naming the column', () => {
    // 12 x 9000 = 108 000, past the 50 000 ceiling.
    const wide: ColumnGroupingCapability = {
      ...dimension('city'),
      distinctEstimate: 9000,
    };

    expect(() =>
      buildGroupQuery(
        descriptor({
          capabilities: { ...CAPABILITIES, city: wide },
          keys: ['order_status', 'city'],
        }),
      ),
    ).toThrow(/Column "city"/);
  });

  it('prefers the catalogue’s refusal over an arithmetic one', () => {
    // Both would fire for this request. "That column cannot be a group key" is
    // the actionable sentence; "the product is too large" is not.
    const wide: ColumnGroupingCapability = {
      ...dimension('city'),
      distinctEstimate: 9000,
    };

    expect(() =>
      buildGroupQuery(
        descriptor({
          capabilities: { ...CAPABILITIES, city: wide },
          keys: ['order_date', 'city'],
        }),
      ),
    ).toThrow('not a legal group key');
  });
});

describe('a truncated group key in the SQL', () => {
  const dated = {
    ...dimension('order_date'),
    canGroup: false as const,
    periods: ['month', 'quarter', 'year'] as const,
    refusal: 'too-many-distinct' as const,
    typeName: 'date',
  };
  const zoned = {
    ...dated,
    column: 'order_timestamp',
    typeName: 'timestamptz',
  };

  const built = ({
    grouping = 'flat',
    keys,
    periods,
  }: {
    readonly grouping?: 'cube' | 'flat' | 'rollup';
    readonly keys: readonly string[];
    readonly periods: Record<string, 'day' | 'month' | 'quarter' | 'year'>;
  }) =>
    buildGroupQuery({
      aggregates: [{ fn: 'count' }],
      allowedColumns: ['order_date', 'order_timestamp', 'status'],
      capabilities: {
        order_date: dated,
        order_timestamp: zoned,
        status: dimension('status'),
      },
      grouping,
      keys,
      maxRows: 500,
      periods,
      schema: 'public',
      table: 'orders',
    });

  it('spells the truncation identically in the projection, GROUPING and the sets', () => {
    // Postgres matches a `GROUPING` argument against a `GROUP BY` expression
    // syntactically, so a second spelling of the same truncation fails to plan
    // rather than answering differently.
    const { text } = built({
      keys: ['order_date'],
      periods: { order_date: 'month' },
    });
    const expression = `date_trunc('month', "order_date"::timestamp)`;

    expect(text).toContain(`${expression} AS "order_date"`);
    expect(text).toContain(`GROUPING(${expression})`);
    expect(text).toContain(`GROUP BY GROUPING SETS ((${expression}))`);
  });

  it('aliases the truncation back to the column name, so nothing downstream changes', () => {
    // The row decoder, the group path and the ORDER BY value term all read the
    // key by the name it was asked for.
    const { text } = built({
      keys: ['order_date'],
      periods: { order_date: 'year' },
    });

    expect(text).toContain('AS "order_date"');
    expect(text).toContain('ORDER BY "order_date" ASC');
  });

  it('pins a zoned column to a stated zone and leaves an unzoned one cast', () => {
    const { text } = built({
      grouping: 'rollup',
      keys: ['order_date', 'order_timestamp'],
      periods: { order_date: 'month', order_timestamp: 'month' },
    });

    expect(text).toContain(`date_trunc('month', "order_date"::timestamp)`);
    expect(text).toContain(`date_trunc('month', "order_timestamp", 'UTC')`);
  });

  it('leaves an untruncated key exactly as it was', () => {
    // A grouping with no granularity has to emit byte-identical SQL to the one
    // it emitted before granularities existed.
    expect(built({ keys: ['status'], periods: {} }).text).toStrictEqual(
      buildGroupQuery({
        aggregates: [{ fn: 'count' }],
        allowedColumns: ['status'],
        capabilities: { status: dimension('status') },
        grouping: 'flat',
        keys: ['status'],
        maxRows: 500,
        schema: 'public',
        table: 'orders',
      }).text,
    );
  });

  it('carries the truncation into every rollup set, including the prefix ones', () => {
    const { text } = built({
      grouping: 'rollup',
      keys: ['order_date', 'status'],
      periods: { order_date: 'quarter' },
    });
    const expression = `date_trunc('quarter', "order_date"::timestamp)`;

    expect(text).toContain(
      `GROUP BY GROUPING SETS ((${expression}, "status"), (${expression}), ())`,
    );
  });
});
