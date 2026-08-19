// @vitest-environment node

import type { QueryFilter } from '@lcabrera/server/db/query-builder/query-builder.types';
import type { TableGroupRowSummary } from '@lcabrera/ui/components/Table/Table.types';

import { closePool } from '@lcabrera/server/db/get-pool.util';
import { TABLE_GROUP_ROW_FIELD } from '@lcabrera/ui/components/Table/Table.constants';
import { afterAll, describe, expect, it } from 'vite-plus/test';

import { selectOrdersPage } from '@/routes/enterprise-orders/.server/enterpriseOrders.service';
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
};

const readGroups = async ({ filters, keys }: ReadGroupsArgs) =>
  selectOrdersPage({
    filters,
    grouping: { aggregates: { total_amount: 'sum' }, keys, mode: 'flat' },
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

type DrillArgs = {
  readonly filters: readonly QueryFilter[];
  readonly keys: readonly string[];
  readonly summary: TableGroupRowSummary;
};

const drilledPage = async ({ filters, keys, summary }: DrillArgs) => {
  // A grid's group row carries a `label` the wire shape does not declare, and is
  // structurally assignable to it — so it is passed through unchanged (ADR-082).
  const drill = toOrderDrillRead({
    filters,
    group: summary,
    groupKeys: keys,
    limit: 1000,
    sort: [],
  });

  expect(drill.kind).toBe('drillable');

  return drill.kind === 'drillable' ? selectOrdersPage(drill.read) : undefined;
};

describe.skipIf(!IS_SMOKE_ENABLED)(
  'drilling a group against a live table',
  () => {
    afterAll(async () => {
      await closePool();
    });

    it('returns exactly the rows the group says it holds', async () => {
      const groups = await readGroups({
        filters: VIEW_FILTERS,
        keys: GROUP_KEYS,
      });
      const group = smallestGroup(groups.data);

      expect(group).toBeDefined();
      if (group === undefined) return;

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
      const group = smallestGroup(groups.data);

      expect(group).toBeDefined();
      if (group === undefined) return;

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
      const group = smallestGroup(groups.data);

      expect(group).toBeDefined();
      if (group === undefined) return;

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
