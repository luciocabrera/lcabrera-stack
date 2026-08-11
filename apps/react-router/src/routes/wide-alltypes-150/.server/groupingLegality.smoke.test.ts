// @vitest-environment node

import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { afterAll, describe, expect, it } from 'vite-plus/test';

import {
  COLUMNS,
  SCHEMA_NAME,
  TABLE_NAME,
} from '@/routes/wide-alltypes-150/WideAlltypes150.constants';

/**
 * Falsification probe for the row-grouping design's central premise: that
 * `TableColumnDataType` is sufficient to decide which columns may be grouped and
 * which aggregates are legal, so that "it never lets an illegal aggregate be
 * emitted".
 *
 * It is not sufficient, in BOTH directions, and this suite is the evidence that
 * settles it before the query builder (#562) and the guard rails (#573) are
 * written on top of the premise. `wide_alltypes_150` is the only route fixture
 * with the type variety to show it — `enterprise_orders` and `car_sales` contain
 * nothing that breaks the mapping, which is why scheduling this last would have
 * surfaced the problem only after everything depended on it.
 *
 * Gated behind `SMOKE_DB` like the enterprise-orders smoke suite, so the DB-less
 * CI unit job and a bare `vp run test` skip it. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/react-router (sources DB_* + sets SMOKE_DB)
 *
 * Read-only apart from `ANALYZE`, which only refreshes planner statistics.
 */
const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

/** Real Postgres type per column, independent of what the route declares. */
const REAL_TYPE = {
  jsonb: 'c_014',
  numeric: 'c_003',
  /** No equality operator at all — cannot appear in GROUP BY. */
  point: 'c_018',
} as const;

const QUALIFIED_TABLE = `"${SCHEMA_NAME}"."${TABLE_NAME}"`;

const declaredDataType = (columnKey: string) =>
  COLUMNS.find((column) => column.key === columnKey)?.dataType;

const queryRejects = async (text: string) => {
  try {
    await getPool().query(text);
    return;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

describe.skipIf(!IS_SMOKE_ENABLED)(
  'grouping legality cannot be derived from TableColumnDataType',
  () => {
    afterAll(async () => {
      await closePool();
    });

    it('declares point, jsonb and numeric columns all as the same "string" dataType', async () => {
      // The premise under test. All three collapse to one vocabulary member, and
      // the design's table calls `string` "the best key" with count/min/max legal.
      expect(declaredDataType(REAL_TYPE.point)).toBe('string');
      expect(declaredDataType(REAL_TYPE.jsonb)).toBe('string');
      expect(declaredDataType(REAL_TYPE.numeric)).toBe('string');

      const { rows } = await getPool().query<{
        readonly attname: string;
        readonly real_type: string;
      }>(
        `SELECT attname, format_type(atttypid, atttypmod) AS real_type
           FROM pg_attribute
          WHERE attrelid = $1::regclass AND attname = ANY($2::text[])`,
        [
          `${SCHEMA_NAME}.${TABLE_NAME}`,
          [REAL_TYPE.point, REAL_TYPE.jsonb, REAL_TYPE.numeric],
        ],
      );
      const byName = new Map(rows.map((row) => [row.attname, row.real_type]));

      expect(byName.get(REAL_TYPE.point)).toBe('point');
      expect(byName.get(REAL_TYPE.jsonb)).toBe('jsonb');
      expect(byName.get(REAL_TYPE.numeric)).toMatch(/^numeric/);
    });

    it('refuses GROUP BY on a point column the vocabulary calls the best key', async () => {
      const message = await queryRejects(
        `SELECT "${REAL_TYPE.point}" FROM ${QUALIFIED_TABLE} GROUP BY "${REAL_TYPE.point}" LIMIT 1`,
      );

      expect(message).toMatch(/could not identify an equality operator/i);
    });

    it('refuses min() on a jsonb column the vocabulary says supports min/max', async () => {
      const message = await queryRejects(
        `SELECT min("${REAL_TYPE.jsonb}") FROM ${QUALIFIED_TABLE}`,
      );

      expect(message).toMatch(/function min\(jsonb\) does not exist/i);
    });

    it('still groups by that same jsonb column, so the failure is per-type not per-family', async () => {
      // The discriminator between "jsonb is unsupported" and "each operator has
      // to be checked against the concrete type": jsonb HAS equality, so it
      // groups fine while min() does not exist for it. No coarsening of the
      // vocabulary can express that split.
      //
      // Grouped over a bounded sample rather than the whole table: the claim is
      // that the operation is LEGAL, and this fixture is a million rows wide, so
      // grouping all of it would measure jsonb hashing throughput instead.
      const { rows } = await getPool().query<{ readonly n: string }>(
        `SELECT count(*) AS n
           FROM (SELECT "${REAL_TYPE.jsonb}"
                   FROM (SELECT "${REAL_TYPE.jsonb}" FROM ${QUALIFIED_TABLE} LIMIT 1000) sample
                  GROUP BY "${REAL_TYPE.jsonb}") grouped`,
      );

      expect(Number(rows[0]?.n)).toBeGreaterThan(0);
    });

    it('hides sum and avg on a numeric column, forbidding aggregates that are legal', async () => {
      // The other direction, and the one that is easy to miss: the mapping does
      // not only permit illegal operations, it also withholds legal ones.
      const { rows } = await getPool().query<{ readonly total: null | string }>(
        `SELECT sum("${REAL_TYPE.numeric}") AS total FROM ${QUALIFIED_TABLE}`,
      );

      expect(rows).toHaveLength(1);
      expect(declaredDataType(REAL_TYPE.numeric)).toBe('string');
    });

    it('reports n_distinct = 0 for the point column even after an explicit ANALYZE', async () => {
      // THE probe of this suite. The guard rail reads a missing distinct-count as
      // UNKNOWN and UNKNOWN as "warn and proceed", so if `0` merely meant "never
      // analyzed" the guard would be right to proceed. It does not: run ANALYZE,
      // and the value is unchanged while neighbouring columns report real
      // statistics. `0` is Postgres saying distinctness is undefined for a type
      // with no equality operator — a refusal, not a missing measurement.
      await getPool().query(`ANALYZE ${QUALIFIED_TABLE}`);

      const { rows } = await getPool().query<{
        readonly attname: string;
        readonly n_distinct: number;
      }>(
        `SELECT attname, n_distinct
           FROM pg_stats
          WHERE schemaname = $1 AND tablename = $2 AND inherited = false
            AND attname = ANY($3::text[])`,
        [
          SCHEMA_NAME,
          TABLE_NAME,
          [REAL_TYPE.point, REAL_TYPE.jsonb, REAL_TYPE.numeric],
        ],
      );
      const byName = new Map(rows.map((row) => [row.attname, row.n_distinct]));

      // The row EXISTS — which is what rules out the never-analyzed reading,
      // since an unanalyzed table has no pg_stats row at all rather than a zero.
      expect(byName.has(REAL_TYPE.point)).toBe(true);
      expect(byName.get(REAL_TYPE.point)).toBe(0);
      expect(byName.get(REAL_TYPE.jsonb)).not.toBe(0);
      expect(byName.get(REAL_TYPE.numeric)).not.toBe(0);
    });
  },
);
