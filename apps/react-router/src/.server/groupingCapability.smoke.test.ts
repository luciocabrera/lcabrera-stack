// @vitest-environment node

import { getColumnGroupingCapabilities } from '@lcabrera/server/db/get-column-grouping-capabilities.util';
import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

/**
 * The live-Postgres half of #563. `@lcabrera/server`'s own suite is deliberately
 * DB-free (ADR-032), so it can assert the resolution rules but never that the
 * catalogue query returns what those rules are fed. This closes that gap: it
 * runs the real query against a fixture carrying one column per analytical role
 * and checks the capability that comes back.
 *
 * Every assertion here was wrong at least once before the query was right, which
 * is the reason it exists rather than being replaced by more unit tests. A
 * `varchar` column has no operator class of its own and an `enum` column's class
 * is registered against `anyenum`, so an equality check that looks only for an
 * exact `opcintype` match silently refuses both — a mocked row could never have
 * shown that.
 *
 * Gated behind `SMOKE_DB` like the sibling suites, so the DB-less CI unit job and
 * a bare `vp run test` skip it. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/react-router (sources DB_* + sets SMOKE_DB)
 */
const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

const SCHEMA = 'public';
const TABLE = 'grouping_capability_probe';
const FIXTURE = `${SCHEMA}.${TABLE}`;
const ENUM_TYPE = `${SCHEMA}.grouping_capability_mood`;

/** One column per case the two gates have to tell apart. */
const COLUMN = {
  /** `numeric`, low-cardinality — a fact that is demonstrably usable as a key. */
  amount: 'amount',
  /** `varchar` — borrows `text`'s operator class rather than owning one. */
  code: 'code',
  /** `jsonb` — has equality, so only the role gate keeps it out. */
  doc: 'doc',
  /** `bool` — a dimension Postgres has no `min`/`max` aggregate for. */
  flag: 'flag',
  /** `int4` primary key — the likeliest user mistake. */
  id: 'id',
  /** `point` — no equality operator at all. */
  loc: 'loc',
  /** `date` — a dimension Postgres defines no `avg` for. */
  madeOn: 'made_on',
  /** The enum — its operator class is registered against `anyenum`. */
  mood: 'mood',
  /** `text` — the uncomplicated dimension. */
  name: 'name',
  /** `text[]` — has equality via `anyarray`, and is still not renderable. */
  tags: 'tags',
} as const;

const resolveCapabilities = async () =>
  getColumnGroupingCapabilities({
    columns: Object.values(COLUMN),
    schema: SCHEMA,
    table: TABLE,
  });

describe.skipIf(!IS_SMOKE_ENABLED)(
  'column grouping capability resolved from the pg catalog',
  () => {
    beforeAll(async () => {
      await getPool().query(`DROP TABLE IF EXISTS ${FIXTURE}`);
      await getPool().query(`DROP TYPE IF EXISTS ${ENUM_TYPE}`);
      await getPool().query(
        `CREATE TYPE ${ENUM_TYPE} AS ENUM ('low', 'mid', 'high')`,
      );
      await getPool().query(
        `CREATE TABLE ${FIXTURE} (
           ${COLUMN.id} int PRIMARY KEY,
           ${COLUMN.name} text,
           ${COLUMN.code} varchar(20),
           ${COLUMN.flag} boolean,
           ${COLUMN.madeOn} date,
           ${COLUMN.amount} numeric(20, 4),
           ${COLUMN.doc} jsonb,
           ${COLUMN.loc} point,
           ${COLUMN.tags} text[],
           ${COLUMN.mood} ${ENUM_TYPE}
         )`,
      );
      await getPool().query(
        `INSERT INTO ${FIXTURE}
           SELECT g,
                  'n' || (g % 7),
                  'c' || (g % 5),
                  g % 2 = 0,
                  current_date - (g % 9),
                  (g % 13)::numeric,
                  jsonb_build_object('k', g % 11),
                  point(g % 7, g % 5),
                  ARRAY['a', 'b'],
                  (ARRAY['low', 'mid', 'high']::${ENUM_TYPE}[])[1 + (g % 3)]
             FROM generate_series(1, 2000) g`,
      );
      await getPool().query(`ANALYZE ${FIXTURE}`);
    });

    afterAll(async () => {
      await getPool().query(`DROP TABLE IF EXISTS ${FIXTURE}`);
      await getPool().query(`DROP TYPE IF EXISTS ${ENUM_TYPE}`);
      await closePool();
    });

    it('resolves every requested column in one round trip', async () => {
      const capabilities = await resolveCapabilities();

      expect(new Set(Object.keys(capabilities))).toEqual(
        new Set(Object.values(COLUMN)),
      );
    });

    it('accepts the string dimensions, including the two with a borrowed operator class', async () => {
      const capabilities = await resolveCapabilities();

      // `varchar` and the enum are the cases a naive equality lookup refuses.
      expect(capabilities[COLUMN.name]?.canGroup).toBe(true);
      expect(capabilities[COLUMN.code]?.canGroup).toBe(true);
      expect(capabilities[COLUMN.mood]?.canGroup).toBe(true);
      expect(capabilities[COLUMN.mood]?.role).toBe('dimension');
    });

    it('refuses jsonb by role, not by capability', async () => {
      const capabilities = await resolveCapabilities();
      const doc = capabilities[COLUMN.doc];

      // Postgres would group it — the sibling legality probe proves it does —
      // so the refusal has to come from the role gate.
      expect(doc?.canGroup).toBe(false);
      expect(doc?.refusal).toBe('not-a-dimension');
      expect(doc?.typeName).toBe('jsonb');
    });

    it('refuses point and arrays for the same reason', async () => {
      const capabilities = await resolveCapabilities();

      expect(capabilities[COLUMN.loc]?.refusal).toBe('not-a-dimension');
      expect(capabilities[COLUMN.tags]?.refusal).toBe('not-a-dimension');
    });

    it('refuses the primary key as unique-ish while keeping it aggregable', async () => {
      const capabilities = await resolveCapabilities();
      const id = capabilities[COLUMN.id];

      expect(id?.refusal).toBe('unique-ish');
      expect(id?.aggregates).toContain('sum');
    });

    it('accepts a low-cardinality fact as a key and offers it sum and avg', async () => {
      const capabilities = await resolveCapabilities();
      const amount = capabilities[COLUMN.amount];

      expect(amount?.role).toBe('fact');
      expect(amount?.canGroup).toBe(true);
      expect(amount?.distinctEstimate).toBe(13);
      expect(amount?.aggregates).toEqual([
        'avg',
        'count',
        'countDistinct',
        'max',
        'min',
        'sum',
      ]);
    });

    it('offers a boolean the aggregates Postgres actually defines for it', async () => {
      const capabilities = await resolveCapabilities();
      const flag = capabilities[COLUMN.flag];

      // No `min`/`max`: Postgres has no boolean variant of either, which is the
      // catalogue correcting the role gate's summary rather than contradicting it.
      expect(flag?.canGroup).toBe(true);
      expect(flag?.aggregates).toEqual([
        'boolAnd',
        'boolOr',
        'count',
        'countDistinct',
      ]);
    });

    it('offers a date dimension min and max but never avg or the boolean pair', async () => {
      // `avg` is defined only for the numeric families and `interval`, and
      // `bool_and`/`bool_or` only for boolean — so a single role permitting all
      // of them still yields a different menu per type.
      const capabilities = await resolveCapabilities();
      const madeOn = capabilities[COLUMN.madeOn];

      expect(madeOn?.canGroup).toBe(true);
      expect(madeOn?.aggregates).toEqual([
        'count',
        'countDistinct',
        'max',
        'min',
      ]);
    });

    it('omits a column the table does not have', async () => {
      const capabilities = await getColumnGroupingCapabilities({
        columns: [COLUMN.name, 'not_a_column'],
        schema: SCHEMA,
        table: TABLE,
      });

      expect(Object.keys(capabilities)).toEqual([COLUMN.name]);
    });
  },
);
