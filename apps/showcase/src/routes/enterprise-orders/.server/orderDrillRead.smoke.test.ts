// @vitest-environment node

/**
 * The criterion #776 exists for, and the one a unit test cannot discharge.
 *
 * A drilled read that drops the grouped view's filters returns rows that are
 * true facts about the table and wrong under the heading they appear beneath — a
 * group stating 214 orders with 1,008 rows under it. Both render, neither
 * throws, and every number is individually correct; a mock returns whatever it
 * was told to, so the scope the rows were drawn from is invisible.
 *
 * Reconciliation against a live table is the only probe that discriminates: the
 * group row states its own `count` and `sum`, and if the drilled rows disagree
 * the drill is reading a different set than the group summarises.
 *
 * A refused grouped read comes back as `{ data: [], error }` rather than
 * throwing (ADR-050), so an absent group and a refused request look identical to
 * `toBeDefined` — the message on the response is what tells them apart.
 *
 * Gated behind `SMOKE_DB`. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/showcase (sources DB_* + sets SMOKE_DB)
 */

import type { QueryFilter } from '@lcabrera/server/db/query-builder/query-builder.types';
import type {
  TableGroupPeriod,
  TableGroupRowSummary,
} from '@lcabrera/ui/components/Table/Table.types';

import { closePool } from '@lcabrera/server/db/get-pool.util';
import { toDrillRead } from '@lcabrera/server/db/olap/to-drill-read.util';
import { withTransaction } from '@lcabrera/server/db/with-transaction.util';
import { TABLE_GROUP_ROW_FIELD } from '@lcabrera/ui/components/Table/Table.constants';
import { afterAll, describe, expect, it } from 'vite-plus/test';

import {
  selectOrderGroupingCapabilities,
  selectOrderGroupKeyTruncations,
  selectOrdersPage,
} from '@/routes/enterprise-orders/.server/enterpriseOrders.service';
import {
  ENTERPRISE_ORDER_PRIMARY_KEY,
  MAX_ENTERPRISE_ORDERS_LIMIT,
} from '@/routes/enterprise-orders/config';

const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

const VIEW_FILTERS: readonly QueryFilter[] = [
  { column: 'priority', operator: 'eq', value: 'High' },
  { column: 'order_id', operator: 'lte', value: 3000 },
];

const GROUP_KEYS = ['shipping_country'];

const NULL_VIEW_FILTERS: readonly QueryFilter[] = [
  { column: 'priority', operator: 'eq', value: 'Low' },
  { column: 'order_id', operator: 'lte', value: 3000 },
];

const NULL_GROUP_KEYS = ['customer_rating'];

type ReadGroupsArgs = {
  readonly filters: readonly QueryFilter[];
  readonly keys: readonly string[];
  readonly periods?: Readonly<Record<string, TableGroupPeriod>>;
};

const readGroups = async ({ filters, keys, periods = {} }: ReadGroupsArgs) =>
  selectOrdersPage({
    filters,
    grouping: {
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      keys,
      mode: 'flat',
      periods,
      shares: [],
    },
    includeTotal: false,
    limit: 1,
    offset: 0,
    sort: [],
  });

const summaryOf = (row: unknown) =>
  (row as Record<string, TableGroupRowSummary | undefined>)[
    TABLE_GROUP_ROW_FIELD
  ];

const summaries = (rows: readonly unknown[]) =>
  rows
    .map((row) => summaryOf(row))
    .filter(
      (summary): summary is TableGroupRowSummary =>
        summary !== undefined && summary.path.length > 0 && summary.count > 0,
    );

const smallestGroup = (rows: readonly unknown[]) =>
  summaries(rows)
    .toSorted((a, b) => a.count - b.count)
    .at(0);

const requireSmallestGroup = (page: {
  readonly data: readonly unknown[];
  readonly error?: unknown;
}) => {
  const group = smallestGroup(page.data);

  if (group === undefined) {
    throw new Error(
      `No group came back: ${JSON.stringify({ error: page.error, rows: page.data.length })}`,
    );
  }

  return group;
};

type DrillArgs = {
  readonly filters: readonly QueryFilter[];
  readonly keys: readonly string[];
  readonly periods?: Readonly<Record<string, TableGroupPeriod>>;
  readonly summary: TableGroupRowSummary;
};

const drilledPage = async ({ filters, keys, periods, summary }: DrillArgs) => {
  const drill = toDrillRead({
    filters,
    group: summary,
    groupKeys: keys,
    limit: 1000,
    maxLimit: MAX_ENTERPRISE_ORDERS_LIMIT,
    primaryKey: ENTERPRISE_ORDER_PRIMARY_KEY,
    sort: [],
    truncations: await selectOrderGroupKeyTruncations(periods),
  });

  expect(drill.kind).toBe('drillable');

  return drill.kind === 'drillable' ? selectOrdersPage(drill.read) : undefined;
};

/**
 * One close for the whole file. Two of them — one per `describe` — would close
 * the pool after the first block, and every query in the second would then fail
 * into `selectOrdersPage`'s catch and read as an empty group set rather than as
 * a connection error.
 */
afterAll(async () => {
  await closePool();
});

describe.skipIf(!IS_SMOKE_ENABLED)(
  'drilling a group against a live table',
  () => {
    it('returns exactly the rows the group says it holds', async () => {
      const groups = await readGroups({
        filters: VIEW_FILTERS,
        keys: GROUP_KEYS,
      });
      const group = requireSmallestGroup(groups);

      const page = await drilledPage({
        filters: VIEW_FILTERS,
        keys: GROUP_KEYS,
        summary: group,
      });

      expect(page?.data).toHaveLength(group.count);
    });

    it('sums to the measure the group reported', async () => {
      const groups = await readGroups({
        filters: VIEW_FILTERS,
        keys: GROUP_KEYS,
      });
      const group = requireSmallestGroup(groups);

      const page = await drilledPage({
        filters: VIEW_FILTERS,
        keys: GROUP_KEYS,
        summary: group,
      });
      const drilled = (page?.data ?? []).reduce(
        (total, row) => total + Number(row.total_amount ?? 0),
        0,
      );
      const reported = Number(
        group.aggregates.find(({ fn }) => fn === 'sum')?.value ?? NaN,
      );

      expect(reported).not.toBeNaN();
      expect(drilled).toBeCloseTo(reported, 2);
    });

    it('returns only rows carrying the key it drilled from', async () => {
      const groups = await readGroups({
        filters: VIEW_FILTERS,
        keys: GROUP_KEYS,
      });
      const group = requireSmallestGroup(groups);

      const page = await drilledPage({
        filters: VIEW_FILTERS,
        keys: GROUP_KEYS,
        summary: group,
      });

      const rows = page?.data ?? [];

      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.shipping_country).toStrictEqual(group.path[0]?.value);
      }
    });

    it('drills a NULL group with IS NULL rather than an equality', async () => {
      const groups = await readGroups({
        filters: NULL_VIEW_FILTERS,
        keys: NULL_GROUP_KEYS,
      });
      const [group] = summaries(groups.data);

      expect(group).toBeDefined();
      if (group === undefined) return;

      expect(group.path[0]?.value).toBeNull();

      const page = await drilledPage({
        filters: NULL_VIEW_FILTERS,
        keys: NULL_GROUP_KEYS,
        summary: group,
      });

      const rows = page?.data ?? [];

      expect(rows).toHaveLength(group.count);
      for (const row of rows) {
        expect(row.customer_rating).toBeNull();
      }
    });
  },
);

const PERIOD_VIEW_FILTERS: readonly QueryFilter[] = [
  { column: 'priority', operator: 'eq', value: 'High' },
  { column: 'order_id', operator: 'lte', value: 3000 },
];

describe.skipIf(!IS_SMOKE_ENABLED)(
  'drilling a group keyed by a derived period',
  () => {
    it('returns exactly the rows of that period, reconciled two ways', async () => {
      const groups = await readGroups({
        filters: PERIOD_VIEW_FILTERS,
        keys: ['order_date'],
        periods: { order_date: 'month' },
      });
      const group = requireSmallestGroup(groups);

      const page = await drilledPage({
        filters: PERIOD_VIEW_FILTERS,
        keys: ['order_date'],
        periods: { order_date: 'month' },
        summary: group,
      });

      expect(page?.data).toHaveLength(group.count);

      const drilled = (page?.data ?? []).reduce(
        (total, row) => total + Number(row.total_amount ?? 0),
        0,
      );
      const reported = Number(
        group.aggregates.find(({ fn }) => fn === 'sum')?.value ?? NaN,
      );

      expect(reported).not.toBeNaN();
      expect(drilled).toBeCloseTo(reported, 2);
    });

    it('returns one group per month, headed by the month rather than an instant', async () => {
      const groups = await readGroups({
        filters: PERIOD_VIEW_FILTERS,
        keys: ['order_date'],
        periods: { order_date: 'month' },
      });
      const labels = summaries(groups.data).map(
        ({ path }) => path[0]?.label ?? '',
      );

      expect(labels.length).toBeGreaterThan(1);
      for (const label of labels) expect(label).toMatch(/^\d{4}-\d{2}$/);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it('groups a column the raw guard refuses, which is the whole point', async () => {
      const capabilities = await selectOrderGroupingCapabilities();

      expect(capabilities.order_date?.canGroup).toBe(false);
      expect(capabilities.order_date?.refusal).toBe('too-many-distinct');
      expect(capabilities.order_date?.periods).toContain('month');
      expect(capabilities.order_date?.periods).not.toContain('day');
    });

    it("truncates a timestamptz in a stated zone, not the session's", async () => {
      const [utc, kiritimati] = await Promise.all(
        ['UTC', 'Pacific/Kiritimati'].map(async (zone) =>
          withTransaction({
            run: async (tx) => {
              await tx.query(`SET LOCAL TimeZone = '${zone}'`);

              const { rows } = await tx.query<{
                readonly pinned: string;
                readonly unpinned: string;
              }>(
                `SELECT extract(epoch FROM date_trunc('month', "order_timestamp", 'UTC'))::text AS pinned,
                        extract(epoch FROM date_trunc('month', "order_timestamp"))::text AS unpinned
                   FROM public.enterprise_orders
                  WHERE order_id <= 3000
                  ORDER BY order_id
                  LIMIT 200`,
              );

              return rows;
            },
          }),
        ),
      );

      expect(utc?.length).toBeGreaterThan(0);
      expect(utc?.map((row) => row.pinned)).toStrictEqual(
        kiritimati?.map((row) => row.pinned),
      );
      expect(utc?.map((row) => row.unpinned)).not.toStrictEqual(
        kiritimati?.map((row) => row.unpinned),
      );
    });
  },
);
