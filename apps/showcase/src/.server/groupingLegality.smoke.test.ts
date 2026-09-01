// @vitest-environment node

/**
 * Falsification probe for the row-grouping design's central premise: that
 * `TableColumnDataType` is sufficient to decide which columns may be grouped and
 * which aggregates are legal. It is not sufficient in either direction, and this
 * suite is the evidence that settled it before #562 and #573 were built on it.
 *
 * The probe owns its fixture. An earlier version read `wide_alltypes_150`, a
 * rendering playground rather than a domain schema, which made the evidence
 * hostage to a table nobody promises to keep. What is under test is Postgres
 * type semantics, so this creates a three-column table and drops it again.
 *
 * Gated behind `SMOKE_DB`, so the DB-less CI unit job and a bare `vp run test`
 * skip it. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/showcase (sources DB_* + sets SMOKE_DB)
 */

import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

const FIXTURE = 'public.grouping_legality_probe';

const COLUMN = {
  /** `numeric` — the vocabulary hides `sum`/`avg`, which are legal. */
  amount: 'amount',
  /** `jsonb` — has equality, so it groups; has no `min`, so min/max is illegal. */
  doc: 'doc',
  /** `point` — no equality operator at all, so it cannot be grouped. */
  loc: 'loc',
} as const;

const DISTINCT_LOC_VALUES = 35;

const queryRejects = async (text: string) => {
  try {
    await getPool().query(text);
    return;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

describe.skipIf(!IS_SMOKE_ENABLED)(
  'grouping legality cannot be derived from a coarse column dataType',
  () => {
    beforeAll(async () => {
      await getPool().query(`DROP TABLE IF EXISTS ${FIXTURE}`);
      await getPool().query(
        `CREATE TABLE ${FIXTURE} (
           id int,
           ${COLUMN.loc} point,
           ${COLUMN.doc} jsonb,
           ${COLUMN.amount} numeric(20, 4)
         )`,
      );
      await getPool().query(
        `INSERT INTO ${FIXTURE}
           SELECT g,
                  point(g % 7, g % 5),
                  jsonb_build_object('k', g % 11),
                  (g % 13)::numeric
             FROM generate_series(1, 2000) g`,
      );
      await getPool().query(`ANALYZE ${FIXTURE}`);
    });

    afterAll(async () => {
      await getPool().query(`DROP TABLE IF EXISTS ${FIXTURE}`);
      await closePool();
    });

    it('refuses GROUP BY on a point column, the type a "string" dataType would call groupable', async () => {
      const message = await queryRejects(
        `SELECT ${COLUMN.loc} FROM ${FIXTURE} GROUP BY ${COLUMN.loc} LIMIT 1`,
      );

      expect(message).toMatch(/could not identify an equality operator/i);
    });

    it('refuses min() on a jsonb column, which the same dataType says supports min/max', async () => {
      const message = await queryRejects(
        `SELECT min(${COLUMN.doc}) FROM ${FIXTURE}`,
      );

      expect(message).toMatch(/function min\(jsonb\) does not exist/i);
    });

    it('still groups by that same jsonb column, which is why the catalogue cannot be the only gate', async () => {
      const { rows } = await getPool().query<{ readonly n: string }>(
        `SELECT count(*) AS n
           FROM (SELECT ${COLUMN.doc} FROM ${FIXTURE} GROUP BY ${COLUMN.doc}) grouped`,
      );

      expect(Number(rows[0]?.n)).toBeGreaterThan(0);
    });

    it('allows sum on a numeric column, an aggregate the coarse dataType withholds', async () => {
      const { rows } = await getPool().query<{ readonly total: null | string }>(
        `SELECT sum(${COLUMN.amount}) AS total FROM ${FIXTURE}`,
      );

      expect(Number(rows[0]?.total)).toBeGreaterThan(0);
    });

    it('reports n_distinct = 0 for the point column even though it has few distinct values', async () => {
      const { rows } = await getPool().query<{
        readonly attname: string;
        readonly n_distinct: number;
      }>(
        `SELECT attname, n_distinct
           FROM pg_stats
          WHERE schemaname = 'public'
            AND tablename = 'grouping_legality_probe'
            AND inherited = false`,
      );
      const byName = new Map(rows.map((row) => [row.attname, row.n_distinct]));

      expect(byName.has(COLUMN.loc)).toBe(true);
      expect(byName.get(COLUMN.loc)).toBe(0);
      expect(byName.get(COLUMN.doc)).toBeGreaterThan(0);
      expect(byName.get(COLUMN.amount)).toBeGreaterThan(0);

      const { rows: actual } = await getPool().query<{
        readonly distinct_values: string;
      }>(
        `SELECT count(DISTINCT ${COLUMN.loc}::text) AS distinct_values FROM ${FIXTURE}`,
      );

      expect(Number(actual[0]?.distinct_values)).toBe(DISTINCT_LOC_VALUES);
    });
  },
);
