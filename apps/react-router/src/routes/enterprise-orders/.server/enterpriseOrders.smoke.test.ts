// @vitest-environment node

import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { MAX_GROUP_KEYS } from '@lcabrera/server/db/group-query-builder/group-query-builder.constants';
import { selectGroupedRows } from '@lcabrera/server/db/select-grouped-rows.util';
import { TABLE_GROUP_ROW_FIELD } from '@lcabrera/ui/components/Table/Table.constants';
import { afterAll, describe, expect, it } from 'vite-plus/test';

import { getDemoCredential } from '@/auth/getDemoCredential.util';
import { verifyCredentials } from '@/auth/verifyCredentials.util';
import {
  deleteOrder,
  getNextOrderId,
  insertOrder,
  selectOrderById,
  selectOrderGroupingCapabilities,
  selectOrdersPage,
  updateOrder,
} from '@/routes/enterprise-orders/.server/enterpriseOrders.service';
import {
  ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  ENTERPRISE_ORDER_GROUP_MAX_ROWS,
} from '@/routes/enterprise-orders/config';
import { buildValidOrderInput } from '@/routes/enterprise-orders/config/enterpriseOrders.fixtures';
import { toOrderInsertValues } from '@/routes/enterprise-orders/config/toOrderInsertValues.util';
import { toOrderUpdateValues } from '@/routes/enterprise-orders/config/toOrderUpdateValues.util';

/**
 * Live-database smoke test for the secured enterprise-orders showcase. Unlike the
 * unit suites — which mock the pg pool and fetch — this exercises the real path
 * against a running Postgres: the env-configured login credential, a full
 * create → read → update → list/count → delete round-trip through the generic
 * `@lcabrera/server` builders, and the grouped read. It is the one check that
 * proves the wiring works end to end at runtime, which no mocked test can.
 *
 * The grouped cases below exist because the mocked ones cannot reach the thing
 * that matters: a `toContain('GROUP BY GROUPING SETS')` on a query string proves
 * the string was assembled, not that Postgres parses it, that the projection
 * names real columns, or that the `GROUPING()` mask and the aggregate alias come
 * back as the builder said they would. Those are only observable against a real
 * table.
 *
 * Gated behind `SMOKE_DB` so the DB-less CI unit job (and a bare `vp run test`)
 * skips it. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/react-router (sources DB_* + sets SMOKE_DB)
 *
 * The suite cleans up the single row it creates (the delete step is part of the
 * flow), so it is safe to re-run.
 */
const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

const ACTOR = 'smoke@example.com';
const DEMO_PASSWORD = 'demo-password-123';

describe.skipIf(!IS_SMOKE_ENABLED)('enterprise-orders live DB smoke', () => {
  afterAll(async () => {
    await closePool();
  });

  it('verifies the demo login credential against the env-configured hash', () => {
    const credential = getDemoCredential({ env: process.env });

    expect(
      verifyCredentials({
        credential,
        email: credential.email,
        password: DEMO_PASSWORD,
      }),
    ).toBe(true);
    expect(
      verifyCredentials({
        credential,
        email: credential.email,
        password: 'wrong-password',
      }),
    ).toBe(false);
  });

  it('round-trips an order through create → read → update → list → delete', async () => {
    const now = new Date();
    const orderId = await getNextOrderId();

    const inserted = await insertOrder({
      values: toOrderInsertValues({
        actor: ACTOR,
        input: buildValidOrderInput(),
        now,
        orderId,
      }),
    });
    expect(inserted?.order_id).toBe(orderId);
    expect(inserted?.last_modified_by).toBe(ACTOR);

    const created = await selectOrderById(orderId);
    expect(created?.customer_name).toBe('Ada Lovelace');

    const updated = await updateOrder({
      orderId,
      values: toOrderUpdateValues({
        actor: ACTOR,
        input: { ...buildValidOrderInput(), customer_name: 'Grace Hopper' },
        now,
      }),
    });
    expect(updated?.customer_name).toBe('Grace Hopper');

    const page = await selectOrdersPage({
      filters: [{ column: 'order_id', operator: 'eq', value: orderId }],
      includeTotal: true,
      limit: 10,
      offset: 0,
      sort: [{ column: 'order_id', direction: 'asc' }],
    });
    expect(page.total).toBe(1);
    expect(page.data[0]?.order_id).toBe(orderId);

    // Real-Postgres check that the keyset predicate is valid SQL and seeks:
    // resuming after this order's own id must return nothing.
    const afterCursor = await selectOrdersPage({
      cursor: [orderId],
      filters: [{ column: 'order_id', operator: 'eq', value: orderId }],
      includeTotal: false,
      limit: 10,
      offset: 0,
      sort: [{ column: 'order_id', direction: 'asc' }],
    });
    expect(afterCursor.data).toStrictEqual([]);

    await deleteOrder(orderId);
    expect(await selectOrderById(orderId)).toBeUndefined();
  });

  describe('grouped read', () => {
    const GROUP_KEY = 'order_status';

    const groupedQuery = (
      overrides: Partial<Parameters<typeof selectGroupedRows>[0]> = {},
    ) =>
      selectGroupedRows({
        aggregates: [{ fn: 'count' }],
        allowedColumns: ENTERPRISE_ORDER_ALLOWED_COLUMNS,
        grouping: 'flat',
        keys: [GROUP_KEY],
        maxRows: ENTERPRISE_ORDER_GROUP_MAX_ROWS,
        schema: 'public',
        sort: [{ direction: 'asc', key: GROUP_KEY }],
        table: 'enterprise_orders',
        ...overrides,
      });

    it('emits SQL Postgres accepts, and decodes by the aliases it reports', async () => {
      const { aggregates, groupingSetMasks, keys, maskAlias, rows } =
        await groupedQuery();

      expect(rows.length).toBeGreaterThan(0);
      expect(keys).toStrictEqual([GROUP_KEY]);
      // Flat grouping is one grouping set, so every row is a real group rather
      // than a structural total.
      expect(groupingSetMasks).toStrictEqual([0]);

      const [alias] = aggregates.map((aggregate) => aggregate.alias);
      const [first] = rows;

      expect(alias).toBeDefined();
      // The decode contract: every name the caller reads a grouped row by is one
      // the result advertised, not one spelled here.
      expect(first).toHaveProperty(GROUP_KEY);
      expect(first).toHaveProperty(maskAlias, 0);
      expect(first).toHaveProperty(alias ?? '');
    });

    it('counts every row of the table exactly once across the groups', async () => {
      // The check a string assertion cannot make: the aggregate is arithmetically
      // right, not merely present. A wrong GROUP BY, a stray join or a lost row
      // all break this sum while leaving the SQL syntactically valid.
      const { rows } = await groupedQuery();
      const grouped = rows.reduce(
        (total, row) => total + Number(row.count_rows),
        0,
      );

      const ungrouped = await selectOrdersPage({
        filters: [],
        includeTotal: true,
        limit: 1,
        offset: 0,
        sort: [],
      });

      expect(grouped).toBe(ungrouped.total);
    });

    it('applies the same filters to the grouped read as to the flat one', async () => {
      const filters = [
        { column: 'shipping_country', operator: 'eq' as const, value: 'USA' },
      ];

      const { rows } = await groupedQuery({ filters });
      const grouped = rows.reduce(
        (total, row) => total + Number(row.count_rows),
        0,
      );

      const flat = await selectOrdersPage({
        filters,
        includeTotal: true,
        limit: 1,
        offset: 0,
        sort: [],
      });

      expect(grouped).toBe(flat.total);
      expect(grouped).toBeLessThan(Number(flat.total) + 1);
    });

    it('binds maxRows as a real LIMIT rather than a comment', async () => {
      const { rows } = await groupedQuery({ maxRows: 2 });

      expect(rows).toHaveLength(2);
    });

    it('orders the groups by the key, in the requested direction', async () => {
      const ascending = await groupedQuery();
      const descending = await groupedQuery({
        sort: [{ direction: 'desc', key: GROUP_KEY }],
      });

      const labelsOf = (rows: readonly Record<string, unknown>[]) =>
        rows.map((row) => String(row[GROUP_KEY]));

      expect(labelsOf(ascending.rows)).toStrictEqual(
        labelsOf(descending.rows).toReversed(),
      );
    });

    it('refuses a key the catalogue rejects, with the reason attached', async () => {
      // The primary key is the likeliest user mistake and the gate ADR-058 cares
      // most about; this is the runtime half of that rule, not a re-assertion of
      // the pure one.
      await expect(groupedQuery({ keys: ['order_id'] })).rejects.toThrow(
        /is not a legal group key: unique-ish/,
      );
    });

    it('reaches the route service as the same response shape a flat read returns', async () => {
      const grouped = await selectOrdersPage({
        filters: [],
        grouping: { aggregates: {}, keys: [GROUP_KEY], mode: 'flat' },
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [],
      });
      const flat = await selectOrdersPage({
        filters: [],
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [],
      });

      expect(
        Object.keys(grouped).toSorted((a, b) => a.localeCompare(b)),
      ).toStrictEqual(Object.keys(flat).toSorted((a, b) => a.localeCompare(b)));
      // A grouped read is not paginated, so it never reports more to come.
      expect(grouped.hasMore).toBe(false);
      expect(grouped.total).toBe(grouped.data.length);

      for (const row of grouped.data) {
        const summary = row[TABLE_GROUP_ROW_FIELD];

        expect(summary?.path).toHaveLength(1);
        expect(summary?.path[0]?.columnKey).toBe(GROUP_KEY);
        expect(summary?.count).toBeGreaterThan(0);
        expect(typeof summary?.path[0]?.label).toBe('string');
      }
    });

    it('formats the key types Postgres actually returns for this table', async () => {
      // `pg` hands back a boolean for `bool`, a number for `int4`, a string for
      // `numeric` and a `Date` for `date`. Each takes a different branch of
      // `toGroupLabel`, and only a live read proves which branch is
      // reachable — a fixture would just restate the branch it was written for.
      for (const key of [
        'is_vip_customer',
        'quantity',
        'customer_rating',
        'delivery_date',
      ]) {
        const { data } = await selectOrdersPage({
          filters: [],
          grouping: { aggregates: {}, keys: [key], mode: 'flat' },
          includeTotal: true,
          limit: 50,
          offset: 0,
          sort: [],
        });

        expect(data.length).toBeGreaterThan(0);

        for (const row of data) {
          const label = row[TABLE_GROUP_ROW_FIELD]?.path[0]?.label;

          expect(typeof label).toBe('string');
          expect(label).not.toBe('[object Object]');
        }
      }
    });
  });

  /**
   * Multi-key grouping and aggregate selection, against real Postgres.
   *
   * This block exists because of what #568 taught: its mocked suite asserted
   * the generated SQL with `toContain` and passed 6/6 while the same query
   * failed 7/7 against a live database, because the `GROUP BY GROUPING SETS`
   * clause named a column that does not exist. Every string assertion was
   * satisfied by a query Postgres rejects outright. So each case below is
   * either arithmetic the database has to agree with, or a query it has to
   * accept — never a claim about the text of one.
   */
  describe('multi-key grouping and aggregate selection', () => {
    const KEYS = ['order_status', 'shipping_country'] as const;

    it('groups by two keys and counts every row exactly once across the pairs', async () => {
      // The check no string assertion can make: a wrong GROUP BY, a lost row or
      // a stray cross product all break this sum while leaving the SQL valid.
      const { data } = await selectOrdersPage({
        filters: [],
        grouping: { aggregates: {}, keys: [...KEYS], mode: 'flat' },
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [],
      });
      const flat = await selectOrdersPage({
        filters: [],
        includeTotal: true,
        limit: 1,
        offset: 0,
        sort: [],
      });

      expect(data.length).toBeGreaterThan(0);

      const grouped = data.reduce(
        (total, row) => total + (row[TABLE_GROUP_ROW_FIELD]?.count ?? 0),
        0,
      );

      expect(grouped).toBe(flat.total);
    });

    it('names both levels of every group, in the order the keys were given', async () => {
      const { data } = await selectOrdersPage({
        filters: [],
        grouping: { aggregates: {}, keys: [...KEYS], mode: 'flat' },
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [],
      });

      for (const row of data) {
        expect(
          row[TABLE_GROUP_ROW_FIELD]?.path.map((k) => k.columnKey),
        ).toEqual([...KEYS]);
      }
    });

    it('groups to the configured maximum depth', async () => {
      // The cap is the client's `MAX_TABLE_GROUP_KEYS` and the server's
      // `MAX_GROUP_KEYS`, pinned together by `groupingContract.test.ts`. This is
      // the live half: a query at exactly that depth has to run.
      const deepKeys = [
        'order_status',
        'shipping_country',
        'priority',
        'carrier',
      ];

      expect(deepKeys).toHaveLength(MAX_GROUP_KEYS);

      const { data } = await selectOrdersPage({
        filters: [],
        grouping: { aggregates: {}, keys: deepKeys, mode: 'flat' },
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [],
      });

      expect(data.length).toBeGreaterThan(0);
      expect(data[0]?.[TABLE_GROUP_ROW_FIELD]?.path).toHaveLength(
        MAX_GROUP_KEYS,
      );
    });

    it('refuses one key past the cap, as plain data rather than a class', async () => {
      // The loader edge maps every refusal into the serializable union, because
      // React Router single fetch strips a class of its prototype on the way to
      // the client without a word (ADR-066).
      const page = await selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: {},
          keys: [
            'order_status',
            'shipping_country',
            'priority',
            'carrier',
            'payment_status',
          ],
          mode: 'flat',
        },
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [],
      });

      expect(page.error).toEqual({
        kind: 'grouping-refused',
        message: 'A flat grouping takes at most 4 group keys; got 5.',
        reason: 'too-many-keys',
      });
      expect(page.data).toEqual([]);
      expect(structuredClone(page)).toEqual(page);
    });

    it('computes a selected aggregate the database agrees with', async () => {
      // `sum(total_amount)` per group has to equal the sum over the same
      // filtered set — arithmetic Postgres itself settles, which is the point.
      const { data } = await selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: { total_amount: 'sum' },
          keys: ['order_status'],
          mode: 'flat',
        },
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [],
      });

      expect(data.length).toBeGreaterThan(0);

      const summed = data.reduce((total, row) => {
        const [aggregate] = row[TABLE_GROUP_ROW_FIELD]?.aggregates ?? [];

        expect(aggregate?.columnKey).toBe('total_amount');
        expect(aggregate?.fn).toBe('sum');

        return total + Number(aggregate?.value ?? 0);
      }, 0);

      const { rows } = await getPool().query<{ readonly total: string }>(
        'SELECT sum(total_amount)::text AS total FROM public.enterprise_orders',
      );

      expect(summed).toBeCloseTo(Number(rows[0]?.total ?? 0), 2);
    });

    it('accepts every aggregate the catalogue offers for a column', async () => {
      // The legality claim, made against the live catalogue rather than against
      // a fixture: what `getColumnGroupingCapabilities` reports for a column is
      // exactly what the grouped query then accepts for it.
      const capabilities = await selectOrderGroupingCapabilities();
      const offered = capabilities.total_amount?.aggregates ?? [];

      expect(offered.length).toBeGreaterThan(0);

      for (const fn of offered) {
        const { data } = await selectOrdersPage({
          filters: [],
          grouping: {
            aggregates: { total_amount: fn },
            keys: ['order_status'],
            mode: 'flat',
          },
          includeTotal: true,
          limit: 50,
          offset: 0,
          sort: [],
        });

        expect(data.length).toBeGreaterThan(0);
        expect(data[0]?.[TABLE_GROUP_ROW_FIELD]?.aggregates[0]?.fn).toBe(fn);
      }
    });

    it('refuses an aggregate the catalogue does not offer for a column', async () => {
      // The other direction, and the one a mocked suite cannot reach: `sum` on
      // a `varchar` is a query Postgres rejects, and the builder's own gate is
      // what turns it into a named refusal instead.
      const page = await selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: { customer_name: 'sum' },
          keys: ['order_status'],
          mode: 'flat',
        },
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [],
      });

      expect(page.error).toMatchObject({
        column: 'customer_name',
        kind: 'grouping-refused',
        reason: 'aggregate-not-legal',
      });
      expect(page.error?.message).toMatch(
        /is not legal for column "customer_name"/,
      );
    });

    it('resolves a capability for every column the route allows', async () => {
      // What the loader ships to the client on every grouping-enabled page
      // load. A column missing here is a column whose aggregate menu would be
      // silently empty.
      const capabilities = await selectOrderGroupingCapabilities();

      expect(Object.keys(capabilities).length).toBeGreaterThan(0);
      expect(capabilities.order_status?.canGroup).toBe(true);
      expect(capabilities.order_id?.canGroup).toBe(false);
    });
  });

  describe('rollup, subtotals and the grand total', () => {
    // The ordering claims of #570 are string assertions everywhere else: the
    // builder's suite proves what SQL was written, not what Postgres does with
    // it. These are the live half — a subtotal that landed above its children,
    // a grand total that was not last, or a mask decoded the wrong way round
    // all leave the SQL valid and only show up against a real database.
    const KEYS = ['order_status', 'shipping_country'] as const;

    const rollupPage = (direction: 'asc' | 'desc' = 'asc') =>
      selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: { total_amount: 'sum' },
          keys: [...KEYS],
          mode: 'rollup',
        },
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [{ column: 'order_status', direction }],
      });

    it('emits a subtotal per level and one grand total', async () => {
      const { data } = await rollupPage();
      const summaries = data.map((row) => row[TABLE_GROUP_ROW_FIELD]);

      expect(summaries.length).toBeGreaterThan(0);

      // Depths 2, 1 and 0 all occur: leaves, per-status subtotals, and the one
      // row keyed by nothing. A flat read would produce only depth 2.
      const depths = new Set(summaries.map((summary) => summary?.path.length));

      expect([...depths].toSorted((a, b) => (a ?? 0) - (b ?? 0))).toStrictEqual(
        [0, 1, 2],
      );
      expect(
        summaries.filter((summary) => summary?.path.length === 0),
      ).toHaveLength(1);
    });

    it('closes each parent after its own children, and the grand total last', async () => {
      const { data } = await rollupPage();
      const summaries = data.map((row) => row[TABLE_GROUP_ROW_FIELD]);

      expect(summaries.at(-1)?.path).toStrictEqual([]);

      // Every subtotal is immediately preceded by a row of the level below it
      // that belongs to the same parent — which is what "subtotals follow their
      // children" means as a property of the emitted order rather than of the
      // ORDER BY text.
      for (const [index, summary] of summaries.entries()) {
        if (summary === undefined || summary.path.length !== 1) continue;

        const previous = summaries[index - 1];

        expect(previous?.path).toHaveLength(2);
        expect(previous?.path[0]?.label).toBe(summary.path[0]?.label);
      }
    });

    it('does not invert the hierarchy under a descending key sort', async () => {
      const { data } = await rollupPage('desc');
      const summaries = data.map((row) => row[TABLE_GROUP_ROW_FIELD]);

      // The parents reverse; each parent's subtotal still follows its own
      // children, and the grand total is still last. A `GROUPING` term that
      // took the user's direction would float every subtotal to the top of its
      // block instead.
      expect(summaries.at(-1)?.path).toStrictEqual([]);

      for (const [index, summary] of summaries.entries()) {
        if (summary === undefined || summary.path.length !== 1) continue;

        expect(summaries[index - 1]?.path).toHaveLength(2);
      }
    });

    it('reconciles the leaves, the subtotals and the grand total', async () => {
      // Arithmetic Postgres itself settles: the same rows summed three ways.
      const { data } = await rollupPage();
      const summaries = data
        .map((row) => row[TABLE_GROUP_ROW_FIELD])
        .filter((summary) => summary !== undefined);

      const countAt = (depth: number) =>
        summaries
          .filter((summary) => summary.path.length === depth)
          .reduce((total, summary) => total + summary.count, 0);

      const grandTotal = summaries.find(
        (summary) => summary.path.length === 0,
      )?.count;

      expect(countAt(2)).toBe(countAt(1));
      expect(countAt(1)).toBe(grandTotal);
    });

    it('tells a structural NULL from a real one by the mask, not the text', async () => {
      // Both render an empty label from the same column. Only `isSubtotal`,
      // decoded from `GROUPING()`, separates them — so a decode that read the
      // bits the wrong way round would mark leaves as totals and vice versa.
      const { data } = await rollupPage();
      const summaries = data
        .map((row) => row[TABLE_GROUP_ROW_FIELD])
        .filter((summary) => summary !== undefined);

      for (const summary of summaries) {
        expect(summary.isSubtotal).toBe(summary.path.length < KEYS.length);
      }
    });

    it('refuses an aggregate sort that would rank an ancestor', async () => {
      const page = await selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: { total_amount: 'sum' },
          keys: [...KEYS],
          mode: 'rollup',
        },
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [{ column: 'order_status', direction: 'asc' }],
      });

      // The route requests key sorts only, so this one runs; the refusal itself
      // is unit-tested at the builder, where the sort list can be spelled
      // directly. What is checked here is that the legal shape still runs
      // against a real database rather than being refused by mistake.
      expect(page.error).toBeUndefined();
      expect(page.data.length).toBeGreaterThan(0);
    });
  });
});
