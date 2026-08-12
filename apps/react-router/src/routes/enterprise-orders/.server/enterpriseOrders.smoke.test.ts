// @vitest-environment node

import { closePool } from '@lcabrera/server/db/get-pool.util';
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
        grouping: [GROUP_KEY],
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

        expect(summary?.columnKey).toBe(GROUP_KEY);
        expect(summary?.count).toBeGreaterThan(0);
        expect(typeof summary?.label).toBe('string');
      }
    });

    it('formats the key types Postgres actually returns for this table', async () => {
      // `pg` hands back a boolean for `bool`, a number for `int4`, a string for
      // `numeric` and a `Date` for `date`. Each takes a different branch of
      // `toOrderGroupLabel`, and only a live read proves which branch is
      // reachable — a fixture would just restate the branch it was written for.
      for (const key of [
        'is_vip_customer',
        'quantity',
        'customer_rating',
        'delivery_date',
      ]) {
        const { data } = await selectOrdersPage({
          filters: [],
          grouping: [key],
          includeTotal: true,
          limit: 50,
          offset: 0,
          sort: [],
        });

        expect(data.length).toBeGreaterThan(0);

        for (const row of data) {
          const label = row[TABLE_GROUP_ROW_FIELD]?.label;

          expect(typeof label).toBe('string');
          expect(label).not.toBe('[object Object]');
        }
      }
    });
  });
});
