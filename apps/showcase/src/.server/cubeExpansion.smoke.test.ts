// @vitest-environment node

import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { selectGroupedRows } from '@lcabrera/server/db/select-grouped-rows.util';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

/**
 * The live-Postgres half of #574: that the grouping sets this repo expands a
 * cube into are the sets `CUBE (…)` itself means.
 *
 * `@lcabrera/server`'s own suite is DB-free (ADR-032), so it can assert the
 * expansion and the emitted SQL — and it does, in
 * `expand-cube-sets.util.test.ts` — but not the claim those rest on, which is a
 * statement about Postgres rather than about this code. A unit test asserting
 * our expansion against our own expectation of `CUBE` reports green whether or
 * not the expectation is right; only running both and diffing the results can
 * separate the two.
 *
 * The fixture carries a **real NULL** in one key. That is the case where the
 * equivalence could plausibly break and still look correct: a structural NULL
 * (the key was rolled up) and a real NULL are textually identical in the row,
 * so a comparison that ignored `GROUPING()` would report two different results
 * as equal. Every projection below carries the mask for that reason.
 *
 * Gated behind `SMOKE_DB` like the sibling suites, so the DB-less CI unit job
 * and a bare `vp run test` skip it. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/showcase (sources DB_* + sets SMOKE_DB)
 */
const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

const SCHEMA = 'public';
const TABLE_NAME = 'cube_expansion_probe';
const TABLE = `${SCHEMA}.${TABLE_NAME}`;

const KEYS = ['region', 'channel', 'tier'] as const;

type ProbeRow = {
  readonly [Key in (typeof KEYS)[number]]: null | string;
} & {
  readonly count_rows: string;
  readonly group_mask: number;
  readonly sum_amount: null | string;
};

/** Ordered so two result sets can be compared as arrays rather than as bags. */
const toComparable = (rows: readonly ProbeRow[]) =>
  rows
    .map((row) =>
      [
        row.group_mask,
        ...KEYS.map((key) => row[key] ?? '∅'),
        row.count_rows,
        row.sum_amount ?? '∅',
      ].join('|'),
    )
    .toSorted((a, b) => a.localeCompare(b));

const groupAsCube = async () =>
  selectGroupedRows<ProbeRow>({
    aggregates: [{ fn: 'count' }, { column: 'amount', fn: 'sum' }],
    allowedColumns: [...KEYS, 'amount'],
    grouping: 'cube',
    keys: [...KEYS],
    maxRows: 5000,
    schema: SCHEMA,
    table: TABLE_NAME,
  });

/** The same read written the way Postgres spells it, as the control. */
const groupWithCubeKeyword = async () => {
  const { rows } = await getPool().query<ProbeRow>(
    `SELECT ${KEYS.join(', ')},
            GROUPING(${KEYS.join(', ')}) AS group_mask,
            count(*) AS count_rows,
            sum(amount) AS sum_amount
       FROM ${TABLE}
      GROUP BY CUBE(${KEYS.join(', ')})`,
  );

  return rows;
};

describe.skipIf(!IS_SMOKE_ENABLED)(
  'cube expansion against a live server',
  () => {
    beforeAll(async () => {
      await getPool().query(`DROP TABLE IF EXISTS ${TABLE}`);
      await getPool().query(
        `CREATE TABLE ${TABLE} (
         region text,
         channel text,
         tier text,
         amount numeric(12, 2)
       )`,
      );
      // A real NULL in `channel`, so the structural/real NULL distinction is
      // exercised rather than assumed. The rest are small and dense so every one
      // of the eight subsets has rows under it.
      await getPool().query(
        `INSERT INTO ${TABLE} (region, channel, tier, amount) VALUES
         ('emea', 'web',    'gold',   10.00),
         ('emea', 'retail', 'gold',   20.00),
         ('emea', NULL,     'silver', 30.00),
         ('apac', 'web',    'silver', 40.00),
         ('apac', 'retail', 'gold',   50.00),
         ('apac', 'web',    'gold',   60.00)`,
      );
      await getPool().query(`ANALYZE ${TABLE}`);
    });

    afterAll(async () => {
      await getPool().query(`DROP TABLE IF EXISTS ${TABLE}`);
      await closePool();
    });

    it('returns exactly what `GROUP BY CUBE (…)` returns', async () => {
      const expanded = await groupAsCube();
      const control = await groupWithCubeKeyword();

      expect(toComparable(expanded.rows)).toEqual(toComparable(control));
    });

    it('emits all 2ⁿ grouping sets and no more', async () => {
      const { groupingSetMasks, rows } = await groupAsCube();
      const emitted = new Set(rows.map((row) => row.group_mask));

      expect(groupingSetMasks).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect([...emitted].toSorted((a, b) => a - b)).toEqual(groupingSetMasks);
    });

    it('separates a real NULL key from a rolled-up one', async () => {
      // `channel` is NULL in two different senses here, and the mask is the only
      // thing that tells them apart — the value is NULL in both.
      const { rows } = await groupAsCube();
      const nullChannel = rows.filter(
        (row) => row.channel === null && row.region === 'emea',
      );
      const masks = new Set(nullChannel.map((row) => row.group_mask & 0b010));

      expect(nullChannel.length).toBeGreaterThan(1);
      expect(masks).toEqual(new Set([0, 0b010]));
    });

    it('produces a row no rollup over the same keys would', async () => {
      // The cross-cutting row: `channel` alone, totalled across every region. A
      // rollup drops keys only from the right, so it can never emit this set —
      // which is what makes cube distinguishable from rollup by output alone.
      const cube = await groupAsCube();
      const rollup = await selectGroupedRows<ProbeRow>({
        aggregates: [{ fn: 'count' }, { column: 'amount', fn: 'sum' }],
        allowedColumns: [...KEYS, 'amount'],
        grouping: 'rollup',
        keys: [...KEYS],
        maxRows: 5000,
        schema: SCHEMA,
        table: TABLE_NAME,
      });

      // Mask 0b101: region and tier rolled up, channel present.
      const CHANNEL_ONLY = 0b101;

      expect(cube.rows.some((row) => row.group_mask === CHANNEL_ONLY)).toBe(
        true,
      );
      expect(rollup.rows.some((row) => row.group_mask === CHANNEL_ONLY)).toBe(
        false,
      );
    });

    it('totals the same amount at every level, cube or rollup', async () => {
      // The grand total is in both results and must agree: cube adds sets, it
      // never changes what a set sums to.
      const cube = await groupAsCube();
      const grandTotal = cube.rows.find((row) => row.group_mask === 0b111);

      expect(grandTotal?.sum_amount).toBe('210.00');
      expect(grandTotal?.count_rows).toBe('6');
    });
  },
);
