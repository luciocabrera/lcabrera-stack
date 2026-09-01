// @vitest-environment node

/**
 * Live-database smoke test for the secured enterprise-orders showcase: the
 * env-configured login credential, a full create → read → update → list/count →
 * delete round trip through the generic `@lcabrera/server` builders, and the
 * grouped read.
 *
 * A `toContain('GROUP BY GROUPING SETS')` on a query string proves the string
 * was assembled, not that Postgres parses it, that the projection names real
 * columns, or that the `GROUPING()` mask and the aggregate alias come back as
 * the builder said. Those are only observable against a real table.
 *
 * Gated behind `SMOKE_DB`, so the DB-less CI unit job and a bare `vp run test`
 * skip it. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/showcase (sources DB_* + sets SMOKE_DB)
 *
 * The suite cleans up the single row it creates, so it is safe to re-run.
 */

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
      expect(groupingSetMasks).toStrictEqual([0]);

      const [alias] = aggregates.map((aggregate) => aggregate.alias);
      const [first] = rows;

      expect(alias).toBeDefined();
      expect(first).toHaveProperty(GROUP_KEY);
      expect(first).toHaveProperty(maskAlias, 0);
      expect(first).toHaveProperty(alias ?? '');
    });

    it('counts every row of the table exactly once across the groups', async () => {
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
      await expect(groupedQuery({ keys: ['order_id'] })).rejects.toThrow(
        /is not a legal group key: unique-ish/,
      );
    });

    it('reaches the route service as the same response shape a flat read returns', async () => {
      const grouped = await selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: [],
          keys: [GROUP_KEY],
          mode: 'flat',
          periods: {},
          shares: [],
        },
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
      for (const [key, periods] of [
        ['is_vip_customer', {}],
        ['quantity', {}],
        ['customer_rating', {}],
        ['delivery_date', { delivery_date: 'month' }],
      ] as const) {
        const { data } = await selectOrdersPage({
          filters: [],
          grouping: {
            aggregates: [],
            keys: [key],
            mode: 'flat',
            periods,
            shares: [],
          },
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

  describe('multi-key grouping and aggregate selection', () => {
    const KEYS = ['order_status', 'shipping_country'] as const;

    it('groups by two keys and counts every row exactly once across the pairs', async () => {
      const { data } = await selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: [],
          keys: [...KEYS],
          mode: 'flat',
          periods: {},
          shares: [],
        },
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
        grouping: {
          aggregates: [],
          keys: [...KEYS],
          mode: 'flat',
          periods: {},
          shares: [],
        },
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
      const deepKeys = [
        'order_status',
        'shipping_country',
        'priority',
        'carrier',
      ];

      expect(deepKeys).toHaveLength(MAX_GROUP_KEYS);

      const { data } = await selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: [],
          keys: deepKeys,
          mode: 'flat',
          periods: {},
          shares: [],
        },
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
      const page = await selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: [],
          keys: [
            'order_status',
            'shipping_country',
            'priority',
            'carrier',
            'payment_status',
          ],
          mode: 'flat',
          periods: {},
          shares: [],
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
      const { data } = await selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
          shares: [],
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
      const capabilities = await selectOrderGroupingCapabilities();
      const offered = capabilities.total_amount?.aggregates ?? [];

      expect(offered.length).toBeGreaterThan(0);

      for (const fn of offered) {
        const { data } = await selectOrdersPage({
          filters: [],
          grouping: {
            aggregates: [{ columnKey: 'total_amount', fn }],
            keys: ['order_status'],
            mode: 'flat',
            periods: {},
            shares: [],
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
      const page = await selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: [{ columnKey: 'customer_name', fn: 'sum' }],
          keys: ['order_status'],
          mode: 'flat',
          periods: {},
          shares: [],
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
      const capabilities = await selectOrderGroupingCapabilities();

      expect(Object.keys(capabilities).length).toBeGreaterThan(0);
      expect(capabilities.order_status?.canGroup).toBe(true);
      expect(capabilities.order_id?.canGroup).toBe(false);
    });
  });

  describe('rollup, subtotals and the grand total', () => {
    const KEYS = ['order_status', 'shipping_country'] as const;

    type RollupPageArgs = {
      readonly direction?: 'asc' | 'desc';
      readonly totalsPlacement?: 'first' | 'last';
    };

    const rollupPage = ({
      direction = 'asc',
      totalsPlacement,
    }: RollupPageArgs = {}) =>
      selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
          keys: [...KEYS],
          mode: 'rollup',
          periods: {},
          shares: [],
        },
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [{ column: 'order_status', direction }],
        ...(totalsPlacement !== undefined && { totalsPlacement }),
      });

    it('emits a subtotal per level and one grand total', async () => {
      const { data } = await rollupPage();
      const summaries = data.map((row) => row[TABLE_GROUP_ROW_FIELD]);

      expect(summaries.length).toBeGreaterThan(0);

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

      for (const [index, summary] of summaries.entries()) {
        if (summary === undefined || summary.path.length !== 1) continue;

        const previous = summaries[index - 1];

        expect(previous?.path).toHaveLength(2);
        expect(previous?.path[0]?.label).toBe(summary.path[0]?.label);
      }
    });

    it('does not invert the hierarchy under a descending key sort', async () => {
      const { data } = await rollupPage({ direction: 'desc' });
      const summaries = data.map((row) => row[TABLE_GROUP_ROW_FIELD]);

      expect(summaries.at(-1)?.path).toStrictEqual([]);

      for (const [index, summary] of summaries.entries()) {
        if (summary === undefined || summary.path.length !== 1) continue;

        expect(summaries[index - 1]?.path).toHaveLength(2);
      }
    });

    it('puts every total above its rows when the placement says first', async () => {
      const { data } = await rollupPage({ totalsPlacement: 'first' });
      const summaries = data.map((row) => row[TABLE_GROUP_ROW_FIELD]);

      expect(summaries.length).toBeGreaterThan(0);

      expect(summaries[0]?.path).toStrictEqual([]);

      for (const [index, summary] of summaries.entries()) {
        if (summary === undefined || summary.path.length !== 1) continue;

        const next = summaries[index + 1];

        expect(next?.path).toHaveLength(2);
        expect(next?.path[0]?.label).toBe(summary.path[0]?.label);
      }
    });

    it('leaves the totals below their rows by default', async () => {
      const { data } = await rollupPage();

      expect(
        data.map((row) => row[TABLE_GROUP_ROW_FIELD]).at(-1)?.path,
      ).toStrictEqual([]);
    });

    it('gives a grand total the leaves add up to, at every level', async () => {
      const { data } = await rollupPage();
      const summaries = data
        .map((row) => row[TABLE_GROUP_ROW_FIELD])
        .filter((summary) => summary !== undefined);
      const amountOf = (summary: (typeof summaries)[number] | undefined) =>
        Number(
          summary?.aggregates.find(
            (entry) => entry.columnKey === 'total_amount',
          )?.value,
        );

      const fromGrandTotalRow = amountOf(
        summaries.find(
          (summary) => summary.isSubtotal && summary.path.length === 0,
        ),
      );
      const fromSummedLeaves = summaries
        .filter((summary) => !summary.isSubtotal)
        .reduce((acc, summary) => acc + amountOf(summary), 0);

      expect(fromGrandTotalRow).toBeGreaterThan(0);
      expect(fromSummedLeaves / fromGrandTotalRow).toBeCloseTo(1, 10);

      const shareAtDepth = (depth: number) =>
        summaries
          .filter((summary) => summary.path.length === depth)
          .reduce(
            (acc, summary) => acc + amountOf(summary) / fromGrandTotalRow,
            0,
          );

      expect(shareAtDepth(2)).toBeCloseTo(1, 10);
      expect(shareAtDepth(1)).toBeCloseTo(1, 10);
      expect(shareAtDepth(0)).toBeCloseTo(1, 10);
    });

    it('cannot derive a share from a non-additive measure', async () => {
      const { data } = await selectOrdersPage({
        filters: [],
        grouping: {
          aggregates: [{ columnKey: 'shipping_country', fn: 'countDistinct' }],
          keys: ['order_status'],
          mode: 'rollup',
          periods: {},
          shares: [],
        },
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [],
      });
      const summaries = data.map((row) => row[TABLE_GROUP_ROW_FIELD]);
      const distinctCountOf = (summary: (typeof summaries)[number]) =>
        Number(
          summary?.aggregates.find((e) => e.columnKey === 'shipping_country')
            ?.value,
        );
      const trueTotal = distinctCountOf(
        summaries.find((summary) => summary?.path.length === 0),
      );
      const summedLeaves = summaries
        .filter((summary) => summary?.path.length === 1)
        .reduce((acc, summary) => acc + distinctCountOf(summary), 0);

      expect(trueTotal).toBeGreaterThan(0);
      expect(summedLeaves).toBeGreaterThan(trueTotal);
    });

    it('reconciles the leaves, the subtotals and the grand total', async () => {
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
          aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
          keys: [...KEYS],
          mode: 'rollup',
          periods: {},
          shares: [],
        },
        includeTotal: true,
        limit: 50,
        offset: 0,
        sort: [{ column: 'order_status', direction: 'asc' }],
      });

      expect(page.error).toBeUndefined();
      expect(page.data.length).toBeGreaterThan(0);
    });
  });
});
