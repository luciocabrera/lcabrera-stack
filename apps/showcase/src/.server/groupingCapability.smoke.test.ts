// @vitest-environment node

/**
 * The live-Postgres half of #563: that the catalogue query returns what
 * ADR-058's resolution rules are fed. `@lcabrera/server`'s own suite is DB-free
 * (ADR-032) and can assert the rules but never their input.
 *
 * A `varchar` column has no operator class of its own and an `enum` column's is
 * registered against `anyenum`, so an equality check looking only for an exact
 * `opcintype` match silently refuses both — which no mocked row could show.
 *
 * Gated behind `SMOKE_DB`, so the DB-less CI unit job and a bare `vp run test`
 * skip it. Run it with a local Postgres up:
 *
 *   vp run db:up            # once, from the repo root
 *   vp run test:smoke       # from apps/showcase (sources DB_* + sets SMOKE_DB)
 */

import { getColumnGroupingCapabilities } from '@lcabrera/server/db/get-column-grouping-capabilities.util';
import { closePool, getPool } from '@lcabrera/server/db/get-pool.util';
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

const IS_SMOKE_ENABLED = Boolean(process.env.SMOKE_DB);

const SCHEMA = 'public';
const TABLE = 'grouping_capability_probe';
const FIXTURE = `${SCHEMA}.${TABLE}`;
const ENUM_TYPE = `${SCHEMA}.grouping_capability_mood`;

const SHADOW_SCHEMA = 'grouping_capability_shadow';
const SHADOW_UUID_TYPE = `${SHADOW_SCHEMA}.uuid`;

const COLUMN = {
  /** `numeric`, low-cardinality — a fact that is demonstrably usable as a key. */
  amount: 'amount',
  /** `inet` — a dimension whose whole type category is admitted. */
  clientIp: 'client_ip',
  /** `varchar` — borrows `text`'s operator class rather than owning one. */
  code: 'code',
  /** `jsonb` — has equality, so only the role gate keeps it out. */
  doc: 'doc',
  /** `interval` — the fact that looks like a date and is not one. */
  dur: 'dur',
  /** A composite named `uuid` in another schema — the shadowing case. */
  fakeId: 'fake_id',
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
  /** `cidr` — reaches `min`/`max` only through its binary cast to `inet`. */
  net: 'net',
  /** `text[]` — has equality via `anyarray`, and is still not renderable. */
  tags: 'tags',
  /** `uuid`, low-cardinality — the identifier admitted by name, not category. */
  tenant: 'tenant',
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
      await getPool().query(`DROP SCHEMA IF EXISTS ${SHADOW_SCHEMA} CASCADE`);
      await getPool().query(`CREATE SCHEMA ${SHADOW_SCHEMA}`);
      await getPool().query(
        `CREATE TYPE ${SHADOW_UUID_TYPE} AS (a int, b int)`,
      );
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
           ${COLUMN.mood} ${ENUM_TYPE},
           ${COLUMN.tenant} uuid,
           ${COLUMN.clientIp} inet,
           ${COLUMN.net} cidr,
           ${COLUMN.dur} interval,
           ${COLUMN.fakeId} ${SHADOW_UUID_TYPE}
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
                  (ARRAY['low', 'mid', 'high']::${ENUM_TYPE}[])[1 + (g % 3)],
                  ('00000000-0000-0000-0000-00000000000' || (g % 4))::uuid,
                  ('10.0.' || (g % 8) || '.' || (g % 250))::inet,
                  ('10.0.' || (g % 8) || '.0/24')::cidr,
                  ((g % 5) || ' days')::interval,
                  (g % 4, g % 4)::${SHADOW_UUID_TYPE}
             FROM generate_series(1, 2000) g`,
      );
      await getPool().query(`ANALYZE ${FIXTURE}`);
    });

    afterAll(async () => {
      await getPool().query(`DROP TABLE IF EXISTS ${FIXTURE}`);
      await getPool().query(`DROP TYPE IF EXISTS ${ENUM_TYPE}`);
      await getPool().query(`DROP SCHEMA IF EXISTS ${SHADOW_SCHEMA} CASCADE`);
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

      expect(capabilities[COLUMN.name]?.canGroup).toBe(true);
      expect(capabilities[COLUMN.code]?.canGroup).toBe(true);
      expect(capabilities[COLUMN.mood]?.canGroup).toBe(true);
      expect(capabilities[COLUMN.mood]?.role).toBe('dimension');
    });

    it('refuses jsonb by role, not by capability', async () => {
      const capabilities = await resolveCapabilities();
      const doc = capabilities[COLUMN.doc];

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

      expect(flag?.canGroup).toBe(true);
      expect(flag?.aggregates).toEqual([
        'boolAnd',
        'boolOr',
        'count',
        'countDistinct',
      ]);
    });

    it('offers a date dimension min and max but never avg or the boolean pair', async () => {
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

    it('reads an interval as a fact and offers it sum and avg', async () => {
      const capabilities = await resolveCapabilities();
      const dur = capabilities[COLUMN.dur];

      expect(dur?.role).toBe('fact');
      expect(dur?.canGroup).toBe(true);
      expect(dur?.aggregates).toEqual([
        'avg',
        'count',
        'countDistinct',
        'max',
        'min',
        'sum',
      ]);
    });

    it('records that an interval group key normalises its values', async () => {
      const { rows } = await getPool().query<{
        readonly group_key: string;
        readonly rows_in_group: string;
      }>(
        `SELECT i::text AS group_key, count(*)::text AS rows_in_group
           FROM (VALUES ('1 mon'::interval), ('30 days'::interval),
                        ('720 hours'::interval), ('5 days'::interval)) v(i)
          GROUP BY i ORDER BY i`,
      );

      expect(rows).toEqual([
        { group_key: '5 days', rows_in_group: '1' },
        { group_key: '1 mon', rows_in_group: '3' },
      ]);
    });

    it('accepts inet and cidr as dimensions', async () => {
      const capabilities = await resolveCapabilities();

      expect(capabilities[COLUMN.net]?.role).toBe('dimension');
      expect(capabilities[COLUMN.net]?.canGroup).toBe(true);
      expect(capabilities[COLUMN.net]?.aggregates).toEqual([
        'count',
        'countDistinct',
        'max',
        'min',
      ]);
      expect(capabilities[COLUMN.clientIp]?.role).toBe('dimension');
    });

    it('groups a foreign-key uuid while refusing the jsonb beside it', async () => {
      const capabilities = await resolveCapabilities();
      const tenant = capabilities[COLUMN.tenant];
      const doc = capabilities[COLUMN.doc];

      const { rows } = await getPool().query<{ readonly typcategory: string }>(
        `SELECT t.typcategory
           FROM pg_type t
           JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'pg_catalog' AND t.typname IN ('uuid', 'jsonb')`,
      );

      expect(rows).toHaveLength(2);
      expect(new Set(rows.map((r) => r.typcategory)).size).toBe(1);

      expect(tenant?.typeName).toBe('uuid');
      expect(tenant?.canGroup).toBe(true);
      expect(tenant?.role).toBe('dimension');
      expect(doc?.typeName).toBe('jsonb');
      expect(doc?.canGroup).toBe(false);
      expect(doc?.refusal).toBe('not-a-dimension');
    });

    it('refuses a composite type that merely shares the uuid name', async () => {
      const capabilities = await resolveCapabilities();
      const fake = capabilities[COLUMN.fakeId];
      const real = capabilities[COLUMN.tenant];

      expect(fake?.typeName).toBe('uuid');
      expect(real?.typeName).toBe('uuid');
      expect(fake?.canGroup).toBe(false);
      expect(fake?.refusal).toBe('not-a-dimension');
      expect(real?.canGroup).toBe(true);
    });

    it('refuses the primary key even though int4 is a groupable category', async () => {
      const capabilities = await resolveCapabilities();

      expect(capabilities[COLUMN.id]?.refusal).toBe('unique-ish');
    });

    it('offers a uuid no min or max, which Postgres does not define', async () => {
      const capabilities = await resolveCapabilities();

      expect(capabilities[COLUMN.tenant]?.aggregates).toEqual([
        'count',
        'countDistinct',
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
