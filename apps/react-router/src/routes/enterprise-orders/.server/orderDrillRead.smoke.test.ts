// @vitest-environment node

import type { QueryFilter } from '@lcabrera/server/db/query-builder/query-builder.types';
import type {
  TableGroupPeriod,
  TableGroupRowSummary,
} from '@lcabrera/ui/components/Table/Table.types';

import { closePool } from '@lcabrera/server/db/get-pool.util';
import { withTransaction } from '@lcabrera/server/db/with-transaction.util';
import { TABLE_GROUP_ROW_FIELD } from '@lcabrera/ui/components/Table/Table.constants';
import { afterAll, describe, expect, it } from 'vite-plus/test';

import {
  selectOrderGroupingCapabilities,
  selectOrderGroupKeyTruncations,
  selectOrdersPage,
} from '@/routes/enterprise-orders/.server/enterpriseOrders.service';
import { toOrderDrillRead } from '@/routes/enterprise-orders/.server/toOrderDrillRead.util';

/**
 * The criterion #776 exists for, and the one a unit test cannot discharge.
 *
 * A drilled read that drops the grouped view's filters returns rows that are
 * true facts about the table and **wrong under the heading they appear
 * beneath** — a group stating 214 orders with 1,008 rows under it. Both render,
 * neither throws, and every number is individually correct. A mocked result
 * cannot show it: the mock returns whatever it was told to, so the scope the
 * rows were drawn from is invisible.
 *
 * Reconciliation against a live table is the only probe that discriminates. The
 * group row states its own `count` and `sum`; the drilled read returns rows. If
 * the two disagree, the drill is reading a different set than the group
 * summarises — which is precisely what dropping a filter does.
 *
 * Gated behind `SMOKE_DB` like the sibling suites. Run it with a local Postgres
 * up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/react-router (sources DB_* + sets SMOKE_DB)
 */
const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

/**
 * Narrow enough that a group's rows fit inside one page, so `count` and the
 * summed measure are compared against the whole group rather than against a
 * truncation. The id bound is load-bearing rather than decoration: the seeded
 * table holds half a million rows, and the smallest `shipping_country` group
 * under `priority` alone is an order of magnitude past the route's page ceiling.
 */
const VIEW_FILTERS: readonly QueryFilter[] = [
  { column: 'priority', operator: 'eq', value: 'High' },
  { column: 'order_id', operator: 'lte', value: 3000 },
];

const GROUP_KEYS = ['shipping_country'];

/**
 * A second slice whose group key really is NULL on every row, so the `IS NULL`
 * branch runs against Postgres rather than only against the translation.
 *
 * `shipping_country` cannot serve here: it is `NOT NULL` on this table, so no
 * NULL group can exist on it however the view is filtered. `customer_rating` is
 * nullable, and under `priority = 'Low'` every row's rating is NULL — so the
 * grouped read returns exactly one group, keyed by NULL.
 */
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
      aggregates: { total_amount: 'sum' },
      keys,
      mode: 'flat',
      periods,
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

/** The smallest group, so one page covers it and `count` is comparable. */
const smallestGroup = (rows: readonly unknown[]) =>
  summaries(rows)
    .toSorted((a, b) => a.count - b.count)
    .at(0);

/**
 * The smallest group, or a failure naming the refusal behind it.
 *
 * A grouped read that is refused comes back as `{ data: [], error }` rather than
 * throwing — the loader edge maps every refusal to data (ADR-050) — so an
 * absent group and a refused request look identical to `toBeDefined`, and the
 * one message that says which is which is on the response.
 */
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
  // A grid's group row carries a `label` the wire shape does not declare, and is
  // structurally assignable to it — so it is passed through unchanged (ADR-082).
  const drill = toOrderDrillRead({
    filters,
    group: summary,
    groupKeys: keys,
    limit: 1000,
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

      // The reconciliation. A drill drawn from the wrong scope returns rows
      // that are individually valid, so only this comparison catches it.
      expect(page?.data).toHaveLength(group.count);
    });

    it('sums to the measure the group reported', async () => {
      // The count alone can agree while the rows are the wrong ones — same
      // cardinality, different set. The summed measure is a second, independent
      // reconciliation over the same page.
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
      // The case the wrong spelling loses in silence: `customer_rating = NULL`
      // is never true, so an equality returns an empty page for a group that
      // reports hundreds of rows — and an empty page renders without error.
      const groups = await readGroups({
        filters: NULL_VIEW_FILTERS,
        keys: NULL_GROUP_KEYS,
      });
      const [group] = summaries(groups.data);

      expect(group).toBeDefined();
      if (group === undefined) return;

      // Guards the fixture, not the code: if the seed ever gives this slice a
      // non-NULL rating, the assertions below would still pass while testing
      // the ordinary equality path instead.
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

/**
 * A month's worth of orders is small enough to fit one page and large enough
 * that a boundary error shows: the failure a range gets wrong is an order at
 * 00:00 on the first or 23:59 on the last, which a per-row date check would
 * accept and a count comparison would not.
 */
const PERIOD_VIEW_FILTERS: readonly QueryFilter[] = [
  { column: 'priority', operator: 'eq', value: 'High' },
  { column: 'order_id', operator: 'lte', value: 3000 },
];

describe.skipIf(!IS_SMOKE_ENABLED)(
  'drilling a group keyed by a derived period',
  () => {
    it('returns exactly the rows of that period, reconciled two ways', async () => {
      // The criterion #786 states, and the one a unit test cannot discharge: a
      // truncated group is filtered by a half-open range, and a range that is
      // off by a day at either end returns rows that are individually inside
      // the month and add up to the wrong total. Only the count and the summed
      // measure catch it.
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
      // `2021-06`, not `2021-06-01T00:00:00.000Z` — and the month named has to
      // be the one the value holds, which an ISO heading gets wrong by a day
      // under any positive UTC offset.
      for (const label of labels) expect(label).toMatch(/^\d{4}-\d{2}$/);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it('groups a column the raw guard refuses, which is the whole point', async () => {
      // `order_date` reports `canGroup: false` with `too-many-distinct` — one
      // group per calendar day — and the same column grouped by month returns a
      // legible number of groups from the same request.
      const capabilities = await selectOrderGroupingCapabilities();

      expect(capabilities.order_date?.canGroup).toBe(false);
      expect(capabilities.order_date?.refusal).toBe('too-many-distinct');
      expect(capabilities.order_date?.periods).toContain('month');
      expect(capabilities.order_date?.periods).not.toContain('day');
    });

    it("truncates a timestamptz in a stated zone, not the session's", async () => {
      // The decision, asserted against Postgres, **with its counterfactual**.
      // A pinned form that happened to agree with the session zone would pass a
      // one-sided check, so the same query also asks the unpinned form: it has
      // to disagree across the two zones, or this test proves nothing about the
      // pin.
      const [utc, kiritimati] = await Promise.all(
        ['UTC', 'Pacific/Kiritimati'].map(async (zone) =>
          withTransaction({
            run: async (tx) => {
              await tx.query(`SET LOCAL TimeZone = '${zone}'`);

              // Epochs, not rendered text. `date_trunc(…, 'UTC')` answers a
              // `timestamptz`, and `to_char` renders one in the **session**
              // zone — so a text comparison would report the pinned form as
              // moving when only its rendering did. The instant is the claim.
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
      // The pin holds: every truncated instant is the same under both zones.
      expect(utc?.map((row) => row.pinned)).toStrictEqual(
        kiritimati?.map((row) => row.pinned),
      );
      // And it is doing something: the unpinned form does not.
      expect(utc?.map((row) => row.unpinned)).not.toStrictEqual(
        kiritimati?.map((row) => row.unpinned),
      );
    });
  },
);
