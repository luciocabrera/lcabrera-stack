// @vitest-environment node

import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

/**
 * Falsification probe for the row-grouping design's central premise: that
 * `TableColumnDataType` is sufficient to decide which columns may be grouped and
 * which aggregates are legal, so that "it never lets an illegal aggregate be
 * emitted".
 *
 * It is not sufficient, in BOTH directions, and this suite is the evidence that
 * settles it before the query builder (#562) and the guard rails (#573) are
 * written on top of the premise.
 *
 * The probe owns its fixture. An earlier version read `wide_alltypes_150`, whose
 * generated columns collapse 20 Postgres types into the five-member vocabulary —
 * convenient, but that table is a rendering playground for wide grids, not a
 * domain schema, so anchoring a load-bearing design decision to its shape made
 * the evidence hostage to a fixture nobody promises to keep. What is actually
 * under test is Postgres type semantics, which hold on any table, so this creates
 * a three-column one and drops it again.
 *
 * Gated behind `SMOKE_DB` like the enterprise-orders smoke suite, so the DB-less
 * CI unit job and a bare `vp run test` skip it. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/react-router (sources DB_* + sets SMOKE_DB)
 */
const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

const FIXTURE = 'public.grouping_legality_probe';

/**
 * Column names are the point of the fixture: each is a type the Table's
 * five-member vocabulary reports as `string`, and each behaves differently.
 */
const COLUMN = {
  /** `numeric` — the vocabulary hides `sum`/`avg`, which are legal. */
  amount: 'amount',
  /** `jsonb` — has equality, so it groups; has no `min`, so min/max is illegal. */
  doc: 'doc',
  /** `point` — no equality operator at all, so it cannot be grouped. */
  loc: 'loc',
} as const;

/** Distinct values per column, chosen so `loc` has FEW — see the n_distinct test. */
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
      // The discriminator between "jsonb is unsupported" and "each operator has
      // to be checked against the concrete type": jsonb HAS equality, so it
      // groups fine while min() does not exist for it. No coarsening of a
      // five-member vocabulary can express that split.
      //
      // Read this as a fact about Postgres, NOT as a recommendation. That
      // `GROUP BY jsonb` runs is precisely why legality cannot be delegated to
      // the catalogue alone: it would offer a column the Table cannot render,
      // whose equality is structural rather than semantic, and which is neither
      // a dimension nor a fact. jsonb is excluded by analytical role, upstream
      // of this check — see the grouping-legality ADR draft.
      const { rows } = await getPool().query<{ readonly n: string }>(
        `SELECT count(*) AS n
           FROM (SELECT ${COLUMN.doc} FROM ${FIXTURE} GROUP BY ${COLUMN.doc}) grouped`,
      );

      expect(Number(rows[0]?.n)).toBeGreaterThan(0);
    });

    it('allows sum on a numeric column, an aggregate the coarse dataType withholds', async () => {
      // The other direction, and the one that is easy to miss: the mapping does
      // not only permit illegal operations, it also hides legal ones.
      const { rows } = await getPool().query<{ readonly total: null | string }>(
        `SELECT sum(${COLUMN.amount}) AS total FROM ${FIXTURE}`,
      );

      expect(Number(rows[0]?.total)).toBeGreaterThan(0);
    });

    it('reports n_distinct = 0 for the point column even though it has few distinct values', async () => {
      // THE probe of this suite. The guard rail reads a missing distinct-count as
      // UNKNOWN and UNKNOWN as "warn and proceed", so if `0` merely meant "not
      // analyzed yet" the guard would be right to proceed.
      //
      // The fixture is built to rule that out twice over: `ANALYZE` ran in
      // beforeAll, AND `loc` holds only 35 distinct values, which Postgres would
      // report exactly if it could compute it at all. It reports 0 regardless,
      // while the neighbouring columns report their real counts. `0` is Postgres
      // saying distinctness is undefined for a type with no equality operator —
      // a refusal, not a missing measurement.
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

      // The row EXISTS — which is what rules out the never-analyzed reading,
      // since an unanalyzed table has no pg_stats row at all rather than a zero.
      expect(byName.has(COLUMN.loc)).toBe(true);
      expect(byName.get(COLUMN.loc)).toBe(0);
      expect(byName.get(COLUMN.doc)).toBeGreaterThan(0);
      expect(byName.get(COLUMN.amount)).toBeGreaterThan(0);

      // And the column demonstrably HAS distinct values — counted through a text
      // cast, which is the only way to distinguish them without an equality
      // operator. So `0` cannot be read as "too few to matter" either.
      const { rows: actual } = await getPool().query<{
        readonly distinct_values: string;
      }>(
        `SELECT count(DISTINCT ${COLUMN.loc}::text) AS distinct_values FROM ${FIXTURE}`,
      );

      expect(Number(actual[0]?.distinct_values)).toBe(DISTINCT_LOC_VALUES);
    });
  },
);
